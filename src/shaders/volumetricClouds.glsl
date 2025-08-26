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

float heightProfile(float y) {
  float h = clamp((y - cloudBaseY) / max(1e-3, cloudTopY - cloudBaseY), 0.0, 1.0);
  return smoothstep(0.0, 0.08, h) * (1.0 - smoothstep(0.92, 1.0, h));
}

float densityAt(vec3 p){
  float n = 1.0 - texture(uVoronoi, p * noiseScale + vec3(0.0, time*0.02, 0.0)).r;
  float d = smoothstep(0.5, 0.8, n);

  // low-frequency coverage (projected), controls where clouds exist
  float covFreq = noiseScale * 0.12; // very low frequency
  float c = 1.0 - texture(uVoronoi, vec3(p.x, 0.0, p.z) * covFreq + vec3(time*0.005)).r;
  float coverage = smoothstep(0.6, 0.7, c);

  return coverage * d * heightProfile(p.y);
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

void main(){
  vec4 sceneCol = texture2D(textureSampler, vUV);
  float z = texture2D(depthSampler, vUV).r;

  // Only draw where the scene left "sky"
  if (z > 0.9995) { gl_FragColor = sceneCol; return; }

  vec3 ro = cameraPos;
  vec3 rd = getWorldRay(vUV);

  // ▶ Clip the march to the box
  float t0, t1;
  if (!intersectAABB(ro, rd, boxMin, boxMax, t0, t1)) {
    gl_FragColor = sceneCol;
    return;
  }

  if (t1 <= t0) { gl_FragColor = sceneCol; return; } 

  // March only inside [t0, t1]
  const int MAX_STEPS = 96;
  float g = 0.8;
  float stepLen = (t1 - t0) / float(steps);
  
    float rnd = fract(sin(dot(vUV, vec2(12.9898,78.233))) * 43758.5453);
    vec3  p = ro + rd * (t0 + (rnd + 0.5) * stepLen);

    const int   LIGHT_STEPS = 8;
float lightLength = 0.6 * (cloudTopY - cloudBaseY); // ~60% of layer thickness
float lStep       = lightLength / float(LIGHT_STEPS);

const float LIGHT_STEP_SCALE = 2.0; // 2x view step is a good start

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

// multi-scatter floor (prevents pitch black)
Lt = max(Lt, 0.2);                // 0.15–0.3 is a good range
float powder = 1.0 - exp(-sigma_t * 1.5);
vec3  S = vec3(1.0) * rho * phase * powder * Lt;

    accum += T * S * stepLen;
    T *= exp(-sigma_t * stepLen);

    if (T < 0.01) break;
    p += rd * stepLen;
  }

  vec3 cloudRGB = accum;
  float alpha = 1.0 - T;
  vec3 outRGB = mix(sceneCol.rgb, cloudRGB, alpha);

  gl_FragColor = vec4(outRGB, 1.0);
}