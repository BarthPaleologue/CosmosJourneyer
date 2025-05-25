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
uniform vec3 albedo;
uniform float innerRadius;
uniform float outerRadius;

#include "../utils/noise1D.glsl";

#include "../utils/remap.glsl";

void main() {
    float distanceToPlanet = remap(vUV.x, 0.0, 1.0, innerRadius, outerRadius);

    float macroRingDensity = completeNoise(fract(seed) + distanceToPlanet * 1e-6 * frequency * 0.05, 1, 2.0, 2.0);
    macroRingDensity = smoothstep(0.0, 0.7, macroRingDensity);

    float microRingDensity = completeNoise(fract(seed) + distanceToPlanet * 1e-6 * frequency * 5.0, 5, 2.0, 2.0);

    float mediumRingDensity = completeNoise(fract(seed) + distanceToPlanet * 1e-6 * frequency, 5, 2.0, 2.0);
    mediumRingDensity = remap(mediumRingDensity, 0.0, 1.0, 0.4, 1.6);

    float ringDensity = macroRingDensity * microRingDensity * mediumRingDensity;

    const float rings_thickness   = 2.0;
    float ringOpacity = 1.0 - exp(-ringDensity * rings_thickness);

    gl_FragColor = vec4(albedo, ringOpacity);
}