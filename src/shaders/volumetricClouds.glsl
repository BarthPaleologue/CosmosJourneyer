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

float hgPhase(float c, float g){
  float gg = g*g;
  return (1.0 - gg) / (4.0*3.14159265 * pow(1.0 + gg - 2.0*g*c, 1.5));
}
float dualPhase(float c){
  const float wF = 0.85;  // forward weight
  const float gF = 0.85;  // forward anisotropy
  const float gB = -0.2;  // mild backscatter
  return wF * hgPhase(c, gF) + (1.0 - wF) * hgPhase(c, gB);
}

float densityAt(vec3 p){
  float shape = 1.0 - texture(uVoronoi, p * 0.5 + vec3(0.0, time*0.02, 0.0)).r;
  shape = smoothstep(0.5, 0.8, shape);
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

float rand(vec2 co) {
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

  float jitter = remap(rand(vUV), 0.0, 1.0, -0.1, 0.1) * 0.2;
  vec3 samplePoint = ro + rd * (t0 + jitter);

  int viewRayStepCount = 64;
  float viewRayStepSize = distanceThroughMedium / float(viewRayStepCount);
  float transmittance = 1.0;
  vec3 scatteredLight = vec3(0.0);

  float absorption = 3.0;
  
  for (int i = 0; i < viewRayStepCount; i++) {
    float density = densityAt(samplePoint);

    float sigma_t = absorption * density;
    float albedo = 0.9;
    float sigma_s = sigma_t * albedo;

    if(density < 0.001) {
      samplePoint += rd * viewRayStepSize;
      continue;
    }

    // Light ray marching
    int lightStepCount = 16;
    float lightTransmittance = 1.0;
    
    float tL0, tL1;
    if (intersectAABB(samplePoint, sunDir, boxMin, boxMax, tL0, tL1) && tL1 > 0.0) {
      float lightStepSize = tL1 / float(lightStepCount);
      vec3  lsp = samplePoint;
      for (int j = 0; j < lightStepCount; ++j) {
        lsp += sunDir * lightStepSize;
        float ld = densityAt(lsp);
        float lightSigma_t = absorption * ld;      // same scale as view σt
        lightTransmittance *= exp(-lightSigma_t * lightStepSize);
        if (lightTransmittance < 1e-3) break;
      }
    } else {
      lightTransmittance = 1.0;
    }
    
    // Phase function for scattering
    float cosTheta = dot(-rd, sunDir);
    float phase = dualPhase(cosTheta);
    
    // Accumulate scattered light
    vec3 lightContribution = vec3(1.0, 0.9, 0.8) * lightTransmittance * phase * sigma_s;

    float powderK = 2.0;                                      // tweak 1–4
    float powder = 1.0 - pow(lightTransmittance, powderK);    // ≈ (1 - T^k)
    vec3  Lpowder = lightContribution * powder * (sigma_s * 0.5);            // 0.5 = strength
    scatteredLight += Lpowder * transmittance * viewRayStepSize;
    
    transmittance *= exp(-sigma_t * viewRayStepSize);
    samplePoint += rd * viewRayStepSize;
  }

  vec3 outRgb = screenColor.rgb * transmittance + scatteredLight;

  gl_FragColor = vec4(outRgb, 1.0);
}