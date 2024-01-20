//  This file is part of CosmosJourneyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

precision highp float;

varying vec2 vUV;

uniform float seed;
uniform float frequency;
uniform float ringStart;
uniform float ringEnd;

#include "../utils/noise1D.glsl";

#include "../utils/remap.glsl";

void main() {
    float normalizedDistance = remap(vUV.x, 0.0, 1.0, ringStart, ringEnd);

    float macroRingDensity = completeNoise(fract(seed) + normalizedDistance * frequency / 10.0, 1, 2.0, 2.0);
    float ringDensity = completeNoise(fract(seed) + normalizedDistance * frequency, 5, 2.0, 2.0);
    ringDensity = mix(ringDensity, macroRingDensity, 0.5);
    ringDensity *= smoothstep(ringStart, ringStart + 0.03, normalizedDistance);
    ringDensity *= smoothstep(ringEnd, ringEnd - 0.03, normalizedDistance);

    ringDensity *= ringDensity;

    gl_FragColor = vec4(ringDensity, 0.0, 0.0, 0.0);
}