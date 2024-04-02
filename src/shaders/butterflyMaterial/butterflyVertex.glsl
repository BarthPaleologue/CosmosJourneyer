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

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 viewProjection;

//uniform mat4 world;

uniform vec3 playerPosition;

uniform float time;

varying vec3 vPosition;
varying vec2 vUV;

varying mat4 normalMatrix;
varying vec3 vNormal;

varying vec3 vOriginalWorldPosition;

// This is used to render the grass blade to the depth buffer properly
// (see https://forum.babylonjs.com/t/how-to-write-shadermaterial-to-depthrenderer/47227/3 and https://playground.babylonjs.com/#6GFJNR#161)
#ifdef FORDEPTH
uniform vec2 depthValues;
varying float vDepthMetric;
#endif

#include "../utils/rotateAround.glsl";

float easeOut(float t, float a) {
    return 1.0 - pow(1.0 - t, a);
}

float easeIn(float t, float alpha) {
    return pow(t, alpha);
}

#include "../utils/remap.glsl";

#include<instancesDeclaration>

void main() {
    #include<instancesVertex>

    vec3 objectWorld = vec3(finalWorld[3].x, finalWorld[3].y, finalWorld[3].z);
    vOriginalWorldPosition = objectWorld;

    // high frequency movement for wing flap
    objectWorld.y += 0.1 * sin(5.0 * time + objectWorld.x * 10.0 + objectWorld.z * 10.0);
    // low frequency movement of larger amplitude for general movement
    objectWorld.y += 0.5 * sin(0.2 * time + objectWorld.x * 15.0 + objectWorld.z * 15.0);

    vec3 butterflyForward = vec3(1.0, 0.0, 0.0);

    float rotationY = sin(0.5 * time + vOriginalWorldPosition.x * 10.0 + vOriginalWorldPosition.z * 10.0) * 3.14;
    vec3 rotatedPosition = rotateAround(position, vec3(0.0, 1.0, 0.0), rotationY);
    butterflyForward = rotateAround(butterflyForward, vec3(0.0, 1.0, 0.0), rotationY);

    vec3 flyPosition = rotateAround(rotatedPosition, butterflyForward, sign(position.z) * cos(10.0 * time + objectWorld.x * 10.0 + objectWorld.z * 10.0));
    flyPosition.y += 3.0;

    objectWorld += butterflyForward * 0.5 * sin(0.5 * time + vOriginalWorldPosition.x * 10.0 + vOriginalWorldPosition.z * 10.0);

    // avoid the player
    vec3 playerToButterfly = objectWorld - playerPosition;
    playerToButterfly.y = 0.0;
    float distanceToPlayer = length(playerToButterfly);
    if (distanceToPlayer < 2.0) {
        objectWorld += normalize(playerToButterfly) * (2.0 - distanceToPlayer);
    }

    finalWorld[3].xyz = objectWorld;

    vec4 outPosition = viewProjection * finalWorld * vec4(flyPosition, 1.0);
    gl_Position = outPosition;

    vPosition = flyPosition;
    vUV = uv;

    normalMatrix = transpose(inverse(finalWorld));

    vNormal = normal;

    #ifdef FORDEPTH
    vDepthMetric = (-gl_Position.z + depthValues.x) / (depthValues.y);
    #endif
}