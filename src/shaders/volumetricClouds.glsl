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

uniform sampler2D blueNoise2d;
uniform int frame;
uniform vec2 resolution;

uniform mat4 invProjection;
uniform mat4 invView;
uniform vec3 cameraPos;
uniform vec3 sunDir;

uniform float time;
uniform vec3 boxMin;
uniform vec3 boxMax;

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

float hgPhase(float cosTheta, float g){
  float gg = g*g;
  return (1.0 - gg) / (4.0 * 3.141592653589793 * pow(1.0 + gg - 2.0*g*cosTheta, 1.5));
}


float dualHG_g(float cosTheta, float g, float w) {
  return mix(hgPhase(cosTheta, -g), hgPhase(cosTheta,  g), w);
}


const float cloudBaseY = 0.0;
const float cloudTopY = 50.0;

float height01(vec3 p) {
  float h = (p.y - cloudBaseY) / max(1e-3, (cloudTopY - cloudBaseY));
  return clamp(h, 0.0, 1.0);
}

// cumulus: round top, thinner near base
float heightMaskCumulus(float h) { 
  return smoothstep(0.05, 0.35, h) * (1.0 - smoothstep(0.75, 0.98, h)); 
}

// stratocumulus: flatter, mid-thickness
float heightMaskStratoCu(float h) { 
  return smoothstep(0.02, 0.20, h) * (1.0 - smoothstep(0.60, 0.90, h)); 
}

// stratus: biased to the bottom
float heightMaskStratus(float h) { 
  return 1.0 - smoothstep(0.15, 0.55, h); 
}

float heightMask(vec3 p, vec3 w) { 
  float h = height01(p);
  float m = w.x * heightMaskCumulus(h) + w.y * heightMaskStratoCu(h) + w.z * heightMaskStratus(h);
  return clamp(m, 0.0, 1.0);
}

float triMix(vec3 v){ return v.x*0.625 + v.y*0.25 + v.z*0.125; } // octave weights

// Perlin-Worley: keep Perlin’s connectivity, add Worley “billow” via dilation
float perlinWorley(vec3 p, float shapeFreq, float kPW){
  vec3  c0 = p * shapeFreq;
  float per = triMix(texture(perlin,  c0       ).rgb);        // 0..1
  float wor = triMix(texture(worley,  c0       ).rgb);        // 0..1
  float worInv = 1.0 - wor;                                  // billow
  // Dilate Perlin by inverted Worley (center around 0 using -0.5)
  float pw = per + (worInv - 0.5) * kPW;
  return clamp(pw, 0.0, 1.0);
}

vec2 pseudoCurl(vec2 uv){
  // cheap pseudo-curl from two shifted Perlin samples; replace later with a real curl texture
  float n1 = triMix(texture(perlin, vec3(uv, 0.123)).rgb);
  float n2 = triMix(texture(perlin, vec3(uv.yx*1.1 + 37.0, 0.456)).rgb);
  vec2 g = vec2(n1 - 0.5, n2 - 0.5);
  // make it divergence-free-ish: rotate 90°
  return vec2(-g.y, g.x);
}

float erosionDetail(vec3 p, float detailFreq, float invAtBase){
  float h = height01(p);
  float wHi = triMix(texture(worley, p * detailFreq).rgb);   // 0..1
  // invert near base for wisps (blend by invAtBase)
  float wBlend = mix(wHi, 1.0 - wHi, invAtBase * (1.0 - h));
  return wBlend;
}

/*float densityAt(vec3 p) {
  // Low-freq sampling for base shape
  vec3 baseCoord = p * 0.01 + vec3(time*0.02, 0.0, 0.0);
  vec3 wS = texture(worley, baseCoord).rgb;     // Worley (3 octaves packed in RGB)
  vec3 pS = texture(perlin, baseCoord * 10.0).rgb;     // Perlin (3 octaves packed in RGB)

  float wLow = triMix(wS);                      // 0..1
  float pLow = triMix(pS);                      // 0..1
  float invW = 1.0 - wLow;

  return smoothstep(0.5, 0.7, invW - pLow * 0.3) * heightMask(p, vec3(1.0));
}*/

const float noiseScale = 1.0 / 200.0;
const float uWarpFreqMul = 0.0;
const float uWarpAmp = 0.0;
const float uShapeFreqMul = 1.2;
const float uErosionStrength = 0.3;
const float uErosionFreqMul = 1.0;
const float uBaseSoftness = 0.3;
const float uTopSoftness = 0.3;

const float uCoverageFreqMul  = 0.25;       // very low frequency field
const float uCoverageLo       = 0.35;       // threshold window like Horizon
const float uCoverageHi       = 0.65;

float coverageAt(vec2 xz) {
  // low-freq “weather” field (use your 3D Perlin as 2D by fixing Z)
  float f = noiseScale * uCoverageFreqMul;
  float c = triMix(texture(perlin, vec3(xz * f + vec2(0.0, time*0.01), 0.0)).rgb);
  return clamp(c, 0.0, 1.0);
}

float densityAt(vec3 p){
  // wind & warp
  vec3  wind = vec3(time*0.02, 0.0, 0.0);
  vec3  pwCoord = (p + wind) * noiseScale * uShapeFreqMul;

  // Turbulence warp in XZ (Horizon uses 2D curl)
  vec2  curl  = pseudoCurl(p.xz * uWarpFreqMul + time * 0.05) * uWarpAmp;
  vec3  q     = p + vec3(curl.x, 0.0, curl.y);

  // Base shape = Perlin-Worley * height profile * coverage
  float basePW   = perlinWorley(pwCoord, 1.0, /*kPW*/ 0.6);
  float hMask    = heightMask(p, /*weights*/ vec3(0.6, 0.3, 0.1)); // tune or drive by weather
  float cov      = coverageAt(q.xz);
  // gate by coverage: push threshold up when coverage is low
  float base     = basePW * hMask;
  base = clamp(remap(base, 1.0 - cov, 1.0, 0.0, 1.0), 0.0, 1.0);

  if (base <= 0.0) return 0.0;

  // Edge-aware erosion detail
  float det = erosionDetail(q * noiseScale, /*detailFreq*/ 10.0 * uErosionFreqMul, /*invAtBase*/ 1.0);
  // Horizon erodes by remapping base through detail
  float d = clamp(remap(base, uErosionStrength * det, 1.0, 0.0, 1.0), 0.0, 1.0);

  // (Optional) soft bottoms / tops (you already have uBaseSoftness/uTopSoftness)
  float h = height01(p);
  d *= smoothstep(0.0, uBaseSoftness, h) * (1.0 - smoothstep(1.0 - uTopSoftness, 1.0, h));

  return d;
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

const float lengthScale = 1.0;

vec3 multipleOctaveScattering(float tau, float cosTheta){
  float attenuation       = 0.2;   // like target
  float contribution      = 0.2;   // like target
  float phaseAttenuation  = 0.5;   // like target
  float c = 1.0;                   // anisotropy scaler per octave

  vec3  L = vec3(0.0);
  float a = 1.0, b = 1.0;

  for (int o = 0; o < 4; ++o){
    float g = 0.3 * c;                               // target: PhaseFunction(0.3 * c, mu)
    float phase = dualHG_g(cosTheta, g, 0.7);        // target's DUAL_LOBE_WEIGHT ~0.7
    vec3  T = exp(-tau * vec3(0.8, 0.8, 1.0) * a);   // RGB extinction (O(1) scale)

    L += b * phase * T;

    a *= attenuation;
    b *= contribution;
    c *= (1.0 - phaseAttenuation);                   // later octaves more isotropic
  }
  return L;
}

vec3 calculateLightEnergy(vec3 origin, float mu, float maxDistance){
  const int lightStepCount = 12;                      // keep your budget
  float stepLen = maxDistance * lengthScale / float(lightStepCount);

  // jitter the light march with blue-noise too
  vec2 bnUV = vUV * (resolution / 128.0);
  float bn  = texture2D(blueNoise2d, bnUV).g;
  bn = fract(bn + float(frame % 64) * 0.7236068);     // another low-disc offset

  float t = stepLen * bn;
  float tau = 0.0;
  for (int j = 0; j < lightStepCount; ++j){
    vec3 lp = origin + sunDir * t;
    //float sdf = sampleLowResCloudMap(lp);
    float d   = densityAt(lp); //sampleHighResDetail(sdf, lp);
    tau += d * stepLen;
    t   += stepLen;
  }

  // ambient + sun (scale to taste)
  vec3 sunLight = vec3(50.0);
  vec3 ambient  = vec3(0.1);
  vec3 powder   = vec3(1.0) - exp(-2.0 * tau * vec3(0.8,0.8,1.0)); // gentle boost

  return ambient + sunLight * multipleOctaveScattering(tau, mu) * mix(2.0 * powder, vec3(1.0), clamp((mu+1.0)*0.5, 0.0, 1.0));
}

vec3 ACESFilm(vec3 x) {
  // Narkowicz ACES fit
  const float a=2.51, b=0.03, c=2.43, d=0.59, e=0.14;
  return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
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

  int viewRayStepCount = 32;
  float viewRayStepSize = distanceThroughMedium / float(viewRayStepCount);

  // Tile blue-noise to screen; animate by a low-discrepancy offset
  const float PHI = 1.61803398875;           // golden ratio
  vec2 bnUV = vUV * (resolution / 128.0);     // assumes a 128x128 blue-noise tile
  float bn = texture2D(blueNoise2d, bnUV).r;
  bn = fract(bn + float(frame % 64) * (1.0 / PHI)); // temporal shuffle

  float jitter = bn * viewRayStepSize;       // [0, stepSize)
  vec3 samplePoint = ro + rd * (t0 + jitter);

  vec3 transmittance = vec3(1.0);
  vec3 scatteredLight = vec3(0.0);
  
  for (int i = 0; i < viewRayStepCount; i++) {
    float density = densityAt(samplePoint);

    vec3 sigma_t = density * vec3(0.8, 0.8, 1.0);
    float albedo = 0.99;
    vec3 sigma_s = sigma_t * albedo;

    if(density < 0.001) {
      samplePoint += rd * viewRayStepSize;
      continue;
    }

    // Light ray marching
    vec3 lightTransmittance = vec3(1.0);
    float tL0, tL1;
    if (intersectAABB(samplePoint, sunDir, boxMin, boxMax, tL0, tL1) && tL1 > 0.0) {
      float startL  = max(0.0, tL0);
      vec3  lOrigin = samplePoint + sunDir * startL;
      float lLen    = max(0.0, tL1 - startL);
      lightTransmittance = calculateLightEnergy(lOrigin, dot(rd, sunDir), lLen);
    }
    
    // Accumulate scattered light
    vec3 lightContribution = lightTransmittance * sigma_s;
    scatteredLight += lightContribution * transmittance * viewRayStepSize * lengthScale;

    transmittance *= exp(-sigma_t * viewRayStepSize * lengthScale);
    samplePoint += rd * viewRayStepSize;
    
    // early-out condition
    if (max(max(transmittance.r, transmittance.g), transmittance.b) < 1e-3) break;
  }

  vec3 hdr = screenColor.rgb * transmittance + scatteredLight;
  vec3 outRgb = ACESFilm(hdr);
  gl_FragColor = vec4(outRgb, 1.0);
}