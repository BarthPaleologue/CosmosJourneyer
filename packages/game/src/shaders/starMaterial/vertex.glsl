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

attribute vec3 position;

uniform mat4 world;
uniform mat4 worldViewProjection;

varying vec3 vPositionW;
varying vec3 vPosition;
varying vec3 vUnitSamplePoint;

#include "../utils/applyQuaternion.glsl";

void main() {
    gl_Position = worldViewProjection * vec4(position, 1.0);

    vPositionW = vec3(world * vec4(position, 1.0));

    vPosition = position;

    vUnitSamplePoint = normalize(position);
}