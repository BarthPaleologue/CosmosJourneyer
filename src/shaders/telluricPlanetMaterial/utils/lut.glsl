//  This file is part of Cosmos Journeyer
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

uniform float minTemperature;
uniform float maxTemperature;

uniform float pressure;


#include "../../utils/noise.glsl";

#include "../../utils/toSphere.glsl";

#include "../../utils/remap.glsl";

#include "./waterBoilingPointCelsius.glsl";

#include "../../utils/smoothSharpener.glsl";

void main() {
    vec3 sphere = toSphere(vUV);

    float waterMeltingPoint = 0.0;// fairly good approximation
    float waterMeltingPoint01 = remap(waterMeltingPoint, minTemperature, maxTemperature, 0.0, 1.0);
    float waterBoilingPoint01 = remap(waterBoilingPointCelsius(pressure), minTemperature, maxTemperature, 0.0, 1.0);

    float moisture01 = completeNoise(sphere * 2.0, 5, 2.0, 2.0) * sqrt(1.0 - waterMeltingPoint01) * waterBoilingPoint01;
    moisture01 = smoothSharpener(moisture01, 2.0);
    moisture01 = clamp(moisture01, 0.0, 1.0);

    vec3 domainWarping = 2.0 * vec3(
        completeNoise(sphere + vec3(23.0, 57.0, -18.0), 5, 2.0, 2.0),
        completeNoise(sphere + vec3(57.0, -18.0, 23.0), 5, 2.0, 2.0),
        completeNoise(sphere + vec3(-18.0, 23.0, 57.0), 5, 2.0, 2.0)
    ) - 0.5;

    float noise = completeNoise(domainWarping + sphere * 10.0, 5, 2.0, 2.0);

    gl_FragColor = vec4(moisture01, noise, 0.0, 0.0);
}