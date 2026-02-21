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

varying vec2 vUV;

uniform float seed;
uniform float frequency;
uniform vec3 iceAlbedo;
uniform vec3 dustAlbedo;
uniform float innerRadius;
uniform float outerRadius;

#include "../utils/noise1D.glsl";

#include "../utils/remap.glsl";

// Deterministic scalar hash used to decorrelate seeded channels.
float ringSeedHash(float p) {
    vec3 p3 = fract(vec3(p) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

void main() {
    float distanceToPlanet = remap(vUV.x, 0.0, 1.0, innerRadius, outerRadius);

    float hashedSeed = ringSeedHash(seed);
    float macroRingDensity = completeNoise(hashedSeed + distanceToPlanet * 1e-6 * frequency * 0.05, 1, 2.0, 2.0);
    macroRingDensity = smoothstep(0.0, 0.7, macroRingDensity);

    float microRingDensity = completeNoise(hashedSeed + distanceToPlanet * 1e-6 * frequency * 5.0, 5, 2.0, 2.0);

    float mediumRingDensity = completeNoise(hashedSeed + distanceToPlanet * 1e-6 * frequency, 5, 2.0, 2.0);
    mediumRingDensity = remap(mediumRingDensity, 0.0, 1.0, 0.4, 1.6);

    float ringDensity = macroRingDensity * microRingDensity * mediumRingDensity;

    const float rings_thickness   = 2.0;
    float ringOpacity = 1.0 - exp(-ringDensity * rings_thickness);

    float distance01 = remap(distanceToPlanet, innerRadius, outerRadius, 0.0, 1.0);

    float centerNoise = completeNoise(ringSeedHash(seed + 97.0), 1, 2.0, 2.0);
    float widthNoise = completeNoise(ringSeedHash(seed + 101.0), 1, 2.0, 2.0);
    float profileNoise = completeNoise(ringSeedHash(seed + 107.0), 1, 2.0, 2.0);
    float directionNoise = completeNoise(ringSeedHash(seed + 109.0), 1, 2.0, 2.0);

    float dustCenter = remap(centerNoise, 0.0, 1.0, 0.15, 0.85);
    float dustHalfWidth = remap(widthNoise, 0.0, 1.0, 0.08, 0.28);

    float centerProfile = 1.0 - smoothstep(dustHalfWidth, dustHalfWidth * 1.8, abs(distance01 - dustCenter));

    float edgeProfile = smoothstep(0.12, 0.48, abs(distance01 - 0.5));
    float directionBias = remap(directionNoise, 0.0, 1.0, -0.25, 0.25);
    edgeProfile = clamp(edgeProfile + directionBias * (distance01 - 0.5) * 2.0, 0.0, 1.0);

    float baseDustFraction = mix(centerProfile, edgeProfile, profileNoise);

    // Broad composition variation.
    float dustNoise = completeNoise(ringSeedHash(seed + 17.0) + distanceToPlanet * 1e-6 * frequency * 0.45, 3, 2.0, 2.0);
    dustNoise = remap(dustNoise, 0.0, 1.0, -0.22, 0.22);

    // Higher-frequency composition streaks to break smooth radial gradients.
    float fineDustNoise = completeNoise(ringSeedHash(seed + 43.0) + distanceToPlanet * 1e-6 * frequency * 2.2, 2, 2.0, 2.0);
    fineDustNoise = remap(fineDustNoise, 0.0, 1.0, -0.12, 0.12);

    // Slightly correlate composition with structure so dense bands are not perfectly uniform.
    float densityBias = remap(ringDensity, 0.0, 1.0, -0.1, 0.1);

    float dustFraction = clamp(baseDustFraction + dustNoise + fineDustNoise + densityBias, 0.0, 1.0);
    dustFraction = smoothstep(0.22, 0.78, dustFraction);
    dustFraction = clamp((dustFraction - 0.5) * 1.2 + 0.5, 0.0, 1.0);
    vec3 ringAlbedo = mix(iceAlbedo, dustAlbedo, dustFraction);

    gl_FragColor = vec4(ringAlbedo, ringOpacity);
}
