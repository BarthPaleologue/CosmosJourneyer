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

precision highp float;

#define RAYMARCH_STEPS 14

varying vec2 vUV;

uniform float intensity;
uniform float nebula_cell_size;
uniform vec3 nebula_cell_id;
uniform vec3 nebula_cell_offset;

#include "./utils/camera.glsl";
#include "./utils/noise.glsl";
#include "./utils/worldFromUV.glsl";

const float maxFogDistance = 6000.0;

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}

vec3 smoothHermite(vec3 t) {
    return t * t * (3.0 - 2.0 * t);
}

vec3 decomposeNebulaPosition(vec3 samplePointLocal, out vec3 sampleCellId) {
    vec3 sampleCellPosition = (samplePointLocal + nebula_cell_offset) / nebula_cell_size;
    vec3 sampleCellDelta = floor(sampleCellPosition);
    sampleCellId = nebula_cell_id + sampleCellDelta;
    return fract(sampleCellPosition);
}

float cellValueNoise(vec3 sampleCellId, vec3 sampleCellLocal, float frequency, vec3 phase) {
    vec3 latticePosition = sampleCellLocal * frequency;
    vec3 latticeBase = floor(latticePosition);
    vec3 latticeFraction = fract(latticePosition);
    vec3 weight = smoothHermite(latticeFraction);
    vec3 baseCorner = sampleCellId * frequency + latticeBase + phase;

    float c000 = hash13(baseCorner);
    float c100 = hash13(baseCorner + vec3(1.0, 0.0, 0.0));
    float c010 = hash13(baseCorner + vec3(0.0, 1.0, 0.0));
    float c110 = hash13(baseCorner + vec3(1.0, 1.0, 0.0));
    float c001 = hash13(baseCorner + vec3(0.0, 0.0, 1.0));
    float c101 = hash13(baseCorner + vec3(1.0, 0.0, 1.0));
    float c011 = hash13(baseCorner + vec3(0.0, 1.0, 1.0));
    float c111 = hash13(baseCorner + vec3(1.0, 1.0, 1.0));

    float ix00 = mix(c000, c100, weight.x);
    float ix10 = mix(c010, c110, weight.x);
    float ix01 = mix(c001, c101, weight.x);
    float ix11 = mix(c011, c111, weight.x);
    float iy0 = mix(ix00, ix10, weight.y);
    float iy1 = mix(ix01, ix11, weight.y);
    return mix(iy0, iy1, weight.z);
}

float fbmCellNoise(vec3 sampleCellId, vec3 sampleCellLocal, float baseFrequency, int octaveCount, vec3 phase) {
    float value = 0.0;
    float weightSum = 0.0;
    float amplitude = 1.0;
    float frequency = baseFrequency;

    for (int octave = 0; octave < 5; octave++) {
        if (octave >= octaveCount) break;
        vec3 octavePhase = phase + vec3(float(octave) * 17.0, float(octave) * 31.0, float(octave) * 47.0);
        value += cellValueNoise(sampleCellId, sampleCellLocal, frequency, octavePhase) * amplitude;
        weightSum += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return value / max(weightSum, 1e-5);
}

float nebulaDensity(vec3 sampleCellId, vec3 sampleCellLocal, out float colorWeight) {
    float broadShape = fbmCellNoise(sampleCellId, sampleCellLocal, 5.0, 4, vec3(0.0));
    float detail = fbmCellNoise(sampleCellId, sampleCellLocal, 12.0, 2, vec3(7.2, -3.8, 1.4));
    float microDetail = cellValueNoise(sampleCellId, sampleCellLocal, 32.0, vec3(-2.0, 5.0, -7.0));

    float structure = broadShape * 0.62 + detail * 0.28 + microDetail * 0.10;
    float diffuseCloud = smoothstep(0.12, 0.82, structure);
    colorWeight = smoothstep(0.18, 0.82, diffuseCloud);

    // Keep darkness between clouds but preserve visible gas structures.
    return 0.10 + diffuseCloud * 0.42;
}

vec3 nebulaColor(vec3 sampleCellId, vec3 sampleCellLocal) {
    float tint = fbmCellNoise(sampleCellId, sampleCellLocal, 8.0, 2, vec3(-3.0, 6.0, -2.0));
    float accent = cellValueNoise(sampleCellId, sampleCellLocal, 16.0, vec3(13.0, 2.0, -11.0));
    float dust = cellValueNoise(sampleCellId, sampleCellLocal, 11.0, vec3(-4.0, 9.0, 1.0));

    vec3 hydrogenRed = vec3(0.42, 0.18, 0.22);
    vec3 dustyViolet = vec3(0.22, 0.20, 0.34);
    vec3 oxygenCyan = vec3(0.12, 0.30, 0.34);
    vec3 warmDust = vec3(0.30, 0.24, 0.20);

    vec3 color = mix(dustyViolet, hydrogenRed, smoothstep(0.16, 0.88, tint));
    color = mix(color, oxygenCyan, smoothstep(0.62, 0.95, accent));
    color = mix(color, warmDust, smoothstep(0.45, 0.95, dust));
    return mix(vec3(0.08, 0.09, 0.13), color, 0.68);
}

vec4 raymarchNebula(vec3 rayOrigin, vec3 rayDirection, float maximumDistance) {
    float marchStart = 0.0;
    float marchDistance = min(maximumDistance, maxFogDistance);
    if (marchDistance <= 0.01) {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    float stepSize = marchDistance / float(RAYMARCH_STEPS);

    vec3 scatteredLight = vec3(0.0);
    float transmittance = 1.0;
    float t = 0.5 * stepSize;

    for (int i = 0; i < RAYMARCH_STEPS; i++) {
        vec3 samplePoint = rayOrigin + rayDirection * t;
        float traveledDistance = t;
        float edgeFade = 1.0 - smoothstep(
            marchDistance - 4.0 * stepSize,
            marchDistance + 1.0 * stepSize,
            traveledDistance
        );
        float colorWeight = 0.0;
        vec3 sampleCellId = vec3(0.0);
        vec3 sampleCellLocal = decomposeNebulaPosition(samplePoint, sampleCellId);
        float density = nebulaDensity(sampleCellId, sampleCellLocal, colorWeight) * edgeFade;
        vec3 color = nebulaColor(sampleCellId, sampleCellLocal);
        vec3 localFogColor = mix(vec3(0.02, 0.022, 0.032), color, colorWeight);

        float extinction = density * stepSize * 0.06;
        scatteredLight += localFogColor * density * stepSize * transmittance;
        transmittance *= exp(-extinction);
        if (transmittance < 0.03) break;

        t += stepSize;
    }

    float fogStrength = intensity * smoothstep(0.0, 1200.0, marchDistance);
    float composedTransmittance = mix(1.0, transmittance, fogStrength);
    vec3 fogColor = scatteredLight * 0.075 * fogStrength;
    fogColor += (hash12(vUV * vec2(4096.0, 2160.0)) - 0.5) / 255.0;

    return vec4(fogColor, composedTransmittance);
}

void main() {
    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);
    vec3 rayDirection = normalize(pixelWorldPosition - camera_position);
    vec4 fogData = raymarchNebula(camera_position, rayDirection, maxFogDistance);
    gl_FragColor = fogData;
}
