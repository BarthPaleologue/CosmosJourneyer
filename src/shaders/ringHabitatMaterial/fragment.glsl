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

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec3 vPosition;
varying vec2 vUV;

uniform sampler2D albedo;
uniform sampler2D normal;
uniform sampler2D metallic;
uniform sampler2D roughness;
uniform sampler2D occlusion;

#define PI 3.1415

float atan2(in float y, in float x)
{
    bool s = (abs(x) > abs(y));
    return mix(PI/2.0 - atan(x,y), atan(y,x), s);
}

#include "../utils/remap.glsl";

void main() {
    float theta = atan2(vPosition.z, vPosition.x);

    theta = remap(theta, 0.0, 1.0, -3.14/2.0, 3.14/2.0);

    vec2 ringUV = vec2(theta * 4.0, vUV.y);

    vec3 albedoColor = texture2D(albedo, ringUV).rgb;

    gl_FragColor = vec4(albedoColor, 1.0);
}