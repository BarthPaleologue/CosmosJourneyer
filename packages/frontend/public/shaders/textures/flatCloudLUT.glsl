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

uniform float worleyFrequency;
uniform float detailFrequency;

#include "../utils/toSphere.glsl";

#include "../utils/worley.glsl";

#include "../utils/noise.glsl";

void main() {
    vec3 sphere = toSphere(vUV);

    float worley = completeWorley(sphere * worleyFrequency, 4, 2.0, 2.0);
    float detailNoise = completeNoise(sphere * detailFrequency, 8, 2.0, 2.0);

    gl_FragColor = vec4(vec3(1.0 - worley, detailNoise, 0.0), 1.0);
}