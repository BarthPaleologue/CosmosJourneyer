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

uniform highp sampler3D worley;
uniform highp sampler3D perlin;

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

#include "./utils/worldFromUV.glsl";

#include "./utils/remap.glsl";

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
  return (1.0 - gg) / (4.0 * 3.141592653589793 * pow(1.0 + gg - 2.0*g*c, 1.5));
}
float dualPhase(float c){
  const float wF = 0.85;   // was 0.85
const float gF = 0.85;  // was 0.85
const float gB = -0.35; // was -0.2
  return wF * hgPhase(c, gF) + (1.0 - wF) * hgPhase(c, gB);
}

float saturate(float x){ return clamp(x, 0.0, 1.0); }
float remap01(float x, float lo, float hi){ return saturate((x - lo) / max(1e-5, hi - lo)); }
float triMix(vec3 v){ return v.x*0.625 + v.y*0.25 + v.z*0.125; } // octave weights


float densityAt(vec3 p){
  // Low-freq sampling for base shape
  vec3 baseCoord = p * noiseScale + vec3(0.0, time*0.02, 0.0);
  vec3 wS = texture(worley, baseCoord).rgb;     // Worley (3 octaves packed in RGB)
  vec3 pS = texture(perlin, baseCoord).rgb;     // Perlin (3 octaves packed in RGB)

  float wLow = triMix(wS);                      // 0..1
  float pLow = triMix(pS);                      // 0..1
  float invW = 1.0 - wLow;

  return smoothstep(0.3, 0.7, pLow * invW);
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

  int viewRayStepCount = 64;
  float viewRayStepSize = distanceThroughMedium / float(viewRayStepCount);

  float jitter = rand(vUV) * viewRayStepSize;              // [0, stepSize)
  vec3 samplePoint = ro + rd * (t0 + jitter);

  float transmittance = 1.0;
  vec3 scatteredLight = vec3(0.0);

  float extinction = 30.0;
  
  for (int i = 0; i < viewRayStepCount; i++) {
    float density = densityAt(samplePoint);

    float sigma_t = extinction * density;
    float albedo = 0.99;
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
      float lightStepSize = (tL1 - tL0) / float(lightStepCount);
      vec3  lsp = samplePoint + sunDir * max(0.0, tL0);
      for (int j = 0; j < lightStepCount; ++j) {
        lsp += sunDir * lightStepSize;
        float ld = densityAt(lsp);
        float lightSigma_t = extinction * ld;      // same scale as view σt
        lightTransmittance *= exp(-lightSigma_t * lightStepSize);
        if (lightTransmittance < 1e-3) break;
      }
    } else {
      lightTransmittance = 1.0;
    }
    
    // Phase function for scattering
    float cosTheta = dot(rd, sunDir);
    float phase = dualPhase(cosTheta);

    float cloudExposure = 10.0;
    
    // Accumulate scattered light
    vec3 lightContribution = vec3(1.0, 0.9, 0.8) * cloudExposure * lightTransmittance * phase * sigma_s;
    scatteredLight += lightContribution * transmittance * viewRayStepSize;

    // powder (multi-scatter-ish), *without* phase
    float powderK = 2.0;
    float powderStrength = 0.5;
    float powder  = 1.0 - pow(lightTransmittance, powderK);
    vec3  Lpowder = vec3(1.0, 0.9, 0.8) * powder * sigma_s * powderStrength;
    scatteredLight += Lpowder * transmittance * viewRayStepSize;

    vec3 skyColor = vec3(0.5, 0.7, 1.0);
    float skyExposure = 0.5;
    float skyOcclusion = 1.0;

    float h = clamp((samplePoint.y - cloudBaseY) / max(1e-3, (cloudTopY - cloudBaseY)), 0.0, 1.0);
    float skyHeight = smoothstep(0.0, 1.0, h);          // more sky toward the top
    float skyOcc = 1.0 - exp(-skyOcclusion * density);  // local occlusion proxy

    vec3 Lsky = skyColor * (skyExposure * skyHeight * skyOcc) * sigma_s;
    scatteredLight += Lsky * transmittance * viewRayStepSize;
    
    transmittance *= exp(-sigma_t * viewRayStepSize);
    samplePoint += rd * viewRayStepSize;

    if (transmittance < 1e-3) break;
  }

  vec3 outRgb = screenColor.rgb * transmittance + scatteredLight;

  gl_FragColor = vec4(outRgb, 1.0);
}