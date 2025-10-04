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
attribute vec3 normal;

uniform mat4 world;
uniform mat4 worldViewProjection;

uniform vec3 chunkPositionPlanetSpace;

uniform mat4 planetWorldMatrix;
uniform float planetRadius;

uniform vec3 cameraPosition;

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec3 vSphereNormalW;

varying vec3 vNormal;
varying vec3 vPosition;

varying vec3 vUnitSamplePoint;
varying vec3 vSamplePoint;

void main() {
    vec4 outPosition = worldViewProjection * vec4(position, 1.0);
    gl_Position = outPosition;
    
    vPositionW = vec3(world * vec4(position, 1.0));
    vNormalW = vec3(world * vec4(normal, 0.0));

    // smooth normal when far away from the planet
    vec3 planetPosition = vec3(planetWorldMatrix[3]);
    float distanceToPlanet = max(0.0, length(cameraPosition - planetPosition) - planetRadius);
    vec3 planetNormalW = normalize(vPositionW - planetPosition);

    vNormalW = mix(vNormalW, planetNormalW, 0.9 * smoothstep(20e3, 300e3, distanceToPlanet));

	vPosition = chunkPositionPlanetSpace + position;

	vUnitSamplePoint = normalize(vPosition);
    vSphereNormalW = vec3(planetWorldMatrix * vec4(vUnitSamplePoint, 0.0));

    // Use a triangle wave to clamp our sample coordinates to the range [0, 1] in a periodic way
    float a = 512.0;
    float p = 4.0 * a;
    // the phase is completely arbitrary, but it is an attempt to minimize the visual artifacts
    vec3 phase = vec3(-132.0, 17.0, 53.0);
    vSamplePoint = (4.0 * a / p) * abs(mod(vPosition + phase, p) - p * 0.5);

	vNormal = normal;
}
