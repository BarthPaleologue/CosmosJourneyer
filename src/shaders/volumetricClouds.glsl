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

  // ----- Base shape (smooth) -----
  // Use a smoothed / “billowized” version of your volume at low freq (acts like a Perlin-ish base)
  float shape = 1.0 - texture(uVoronoi, p * noiseScale * uShapeFreqMul + vec3(0.0, time*0.02, 0.0)).r;
  
  shape = smoothstep(0.6, 0.75, shape);                // threshold to blobby cloud masses

  return shape;
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

#include "./utils/remap.glsl";

float rand(vec2 co){
  return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

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

  float distanceThroughMedium = t1 - t0;

  float jitter = remap(rand(vUV), 0.0, 1.0, -0.1, 0.1);
  vec3 samplePoint = ro + rd * (t0 + jitter);

  int viewRayStepCount = 64;
  float viewRayStepSize = distanceThroughMedium / float(viewRayStepCount);
  float transmittance = 1.0;
  for (int i = 0; i < viewRayStepCount; i++) {
    float t = t0 + float(i) * viewRayStepSize;
    vec3 p = ro + rd * t;

    float density = 0.005 * densityAt(p);
    transmittance *= (1.0 - density * viewRayStepSize);
  }

  vec3 cloudColor = vec3(1.0);

  float cloudOpacity = 1.0 - transmittance;

  gl_FragColor = vec4(mix(screenColor.rgb, cloudColor, cloudOpacity), 1.0);
}