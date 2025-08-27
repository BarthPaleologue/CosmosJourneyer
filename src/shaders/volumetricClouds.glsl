//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

#define DISABLE_UNIFORMITY_ANALYSIS

precision highp float;

varying vec2 vUV;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

uniform highp sampler3D uVoronoi;

uniform mat4 invProjection;
uniform mat4 invView;
uniform vec3 cameraPos;
uniform vec3 sunDir;

uniform float time;
uniform float cloudBaseY;
uniform float cloudTopY;
uniform float density;
uniform float noiseScale;
uniform int   steps;

uniform vec3 boxMin;
uniform vec3 boxMax;

uniform float uShapeFreqMul;
uniform float uErosionFreqMul;
uniform float uErosionStrength;
uniform float uWarpFreqMul;
uniform float uWarpAmp;
uniform float uCoverageFreqMul;
uniform float uCoverageLo;
uniform float uCoverageHi;
uniform float uBaseSoftness;
uniform float uTopSoftness;
uniform float uAnvilStart;
uniform float uAnvilSharpness;
uniform float uAnvilSpread;
uniform float uFlattenTop;

// --- helpers ---
vec3 getWorldRay(vec2 uv){
  vec2 ndc = uv * 2.0 - 1.0;
  vec4 clip = vec4(ndc, 1.0, 1.0);
  vec4 view = invProjection * clip;
  view /= view.w;
  vec3 dirV = normalize(view.xyz);
  vec3 dirW = (invView * vec4(dirV, 0.0)).xyz;
  return normalize(dirW);
}

float remap01(float x, float lo, float hi) { return clamp((x - lo) / max(1e-6, hi - lo), 0.0, 1.0); }

// cheap 3D domain warp from the same volume (uses rgb as a pseudo vector)
vec3 warp3(vec3 p, float freq, float amp){
  vec3 w = texture(uVoronoi, p * freq + vec3(0.0, time*0.01, 1.7)).xyz; // 0..1
  return (w * 2.0 - 1.0) * amp; // -amp..amp (world units)
}

float hgPhase(float c, float g){
  float gg = g*g;
  return (1.0 - gg) / (4.0*3.14159265 * pow(1.0 + gg - 2.0*g*c, 1.5));
}
float dualPhase(float c){
  const float wF = 0.85;  // forward weight
  const float gF = 0.75;  // forward anisotropy
  const float gB = -0.2;  // mild backscatter
  return wF * hgPhase(c, gF) + (1.0 - wF) * hgPhase(c, gB);
}

float densityAt(vec3 p){
  // Height in [0,1] inside the layer
  float h = clamp((p.y - cloudBaseY) / max(1e-3, cloudTopY - cloudBaseY), 0.0, 1.0);

  // ----- Anvil shaping (wind shear + vertical flatten near top) -----
  // push samples downwind near the top; keep your own sunDir for now, or set a custom shearDir uniform if you prefer
  vec3 shearDir = normalize(vec3(sunDir.x, 0.0, sunDir.z)); // horizontal component only
  float anvilT = pow(remap01(h, uAnvilStart, 1.0), uAnvilSharpness); // starts near top
  p += shearDir * (uAnvilSpread * anvilT);                            // horizontal spread
  // flatten vertical frequency at the top so tops look “anvily”
  float yFreq = mix(1.0, uFlattenTop, anvilT);
  vec3 shapeScaleVec   = vec3(noiseScale) * vec3(1.0, yFreq, 1.0);    // reduce Y freq near top

  // ----- Domain warp to kill the Voronoi cell look -----
  vec3 pw = p + warp3(p, noiseScale * uWarpFreqMul, uWarpAmp * (0.3 + 0.7*h)); // more warp higher up

  // ----- Base shape (smooth) -----
  // Use a smoothed / “billowized” version of your volume at low freq (acts like a Perlin-ish base)
  float s0 = texture(uVoronoi, pw * shapeScaleVec * uShapeFreqMul + vec3(0.0, time*0.02, 0.0)).r;
  // remap & soften: invert + billow = fewer hard ridges
  float shape = 1.0 - abs(2.0*s0 - 1.0);                // billow
  shape = smoothstep(0.35, 0.75, shape);                // threshold to blobby cloud masses

  // ----- Erosion/detail (Worley at higher freq) -----
  float e0 = texture(uVoronoi, pw * (noiseScale * uErosionFreqMul) + vec3(7.1, time*0.03, 3.3)).r;
  float erosion = smoothstep(0.2, 0.8, e0);
  // subtract “pockets” from the base shape (classic Perlin-Worley look)
  float shaped = clamp(shape - (1.0 - erosion) * uErosionStrength, 0.0, 1.0);

  // ----- Coverage (projected) -----
  float c = 1.0 - texture(uVoronoi, vec3(p.x, 0.0, p.z) * (noiseScale * uCoverageFreqMul) + vec3(time*0.005)).r;
  float coverage = smoothstep(uCoverageLo, uCoverageHi, c);

  // ----- Height profile (base rise + soft top) -----
  float profile = smoothstep(0.0, uBaseSoftness, h) * (1.0 - smoothstep(1.0 - uTopSoftness, 1.0, h));

  return coverage * shaped * profile;
}

// ▶ Ray–AABB intersection (slab method). Returns [t0, t1] if hit.
bool intersectAABB(vec3 ro, vec3 rd, vec3 bmin, vec3 bmax, out float t0, out float t1){
  vec3 invD = 1.0 / rd;                  // INF is fine if any rd component is 0
  vec3 tA = (bmin - ro) * invD;
  vec3 tB = (bmax - ro) * invD;
  vec3 tmin = min(tA, tB);
  vec3 tmax = max(tA, tB);
  t0 = max(max(tmin.x, tmin.y), max(tmin.z, 0.0)); // start no earlier than the camera
  t1 = min(min(tmax.x, tmax.y), tmax.z);
  return t1 > t0;
}

#include "./utils/worldFromUV.glsl";

void main(){
  vec4 screenColor = texture2D(textureSampler, vUV);
  float depth = texture2D(depthSampler, vUV).r;

  // Only draw where the scene left "sky"
  if (depth > 0.9995) { gl_FragColor = screenColor; return; }

  vec3 ro = cameraPos;
  vec3 rd = getWorldRay(vUV);

  // ▶ Clip the march to the box
  float t0, t1;
  if (!intersectAABB(ro, rd, boxMin, boxMax, t0, t1)) {
    gl_FragColor = screenColor;
    return;
  }

  if (t1 <= t0) { gl_FragColor = screenColor; return; } 

  // March only inside [t0, t1]
  const int MAX_STEPS = 96;
  float stepLen = (t1 - t0) / float(steps);
  
  float rnd = fract(sin(dot(vUV, vec2(12.9898,78.233))) * 43758.5453);
  vec3  p = ro + rd * (t0 + (rnd + 0.5) * stepLen);

  const int   LIGHT_STEPS = 8;
  float lightLength = 0.6 * (cloudTopY - cloudBaseY); // ~60% of layer thickness
  float lStep       = lightLength / float(LIGHT_STEPS);

  float T = 1.0;
  vec3  accum = vec3(0.0);

  for (int i = 0; i < MAX_STEPS; ++i) {
    if (i >= steps) break;

    float rho = densityAt(p);
    float sigma_t = rho * density;

    float Lt = 1.0;
    vec3  L  = normalize(sunDir);
    vec3  q  = p;

    // short light march toward the sun
    for (int j = 0; j < LIGHT_STEPS; ++j) { 
      // optional: avoid over-darkening once we exit the slab
      if (q.y < cloudBaseY || q.y > cloudTopY) break;

      float lrho = densityAt(q);
      float lsigma_t = lrho * density;
      Lt *= exp(-lsigma_t * lStep);
      if (Lt < 0.01) break;
      q += L * lStep;
    }

    // phase (incoming is -L, outgoing is rd)
    float phase = dualPhase(dot(rd, -L));


    float powder = 1.0 - exp(-sigma_t * 1.5);
    vec3  S = vec3(1.0) * rho * phase * powder * Lt;

    accum += T * S * stepLen;
    T *= exp(-sigma_t * stepLen);

    if (T < 0.01) break;
    p += rd * stepLen;
  }

  vec3 cloudRGB = accum;
  float alpha = 1.0 - T;
  vec3 outRGB = mix(screenColor.rgb, cloudRGB, alpha);

  gl_FragColor = vec4(outRGB, 1.0);
}