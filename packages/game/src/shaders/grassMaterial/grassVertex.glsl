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
precision lowp int;

attribute vec3 position;
attribute vec3 normal;

uniform mat4 view;
uniform mat4 projection;

uniform vec3 cameraPosition;
uniform vec3 playerPosition;

uniform mat4 planetWorld;
uniform vec3 planetPosition;

uniform float time;

uniform sampler2D perlinNoise;

varying vec3 vPosition;
varying vec3 vPositionW;

varying mat4 normalMatrix;
varying vec3 vNormalW;

varying float vPlanetNdl;

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

#include "../utils/stars.glsl";

void main() {
    #include<instancesVertex>

    mat4 worldMatrix = planetWorld * finalWorld;

    // wind
    vec3 objectWorld = worldMatrix[3].xyz;
    float windStrength = texture2D(perlinNoise, objectWorld.xz * 0.007 + 0.1 * time).r;
    float windDir = texture2D(perlinNoise, objectWorld.xz * 0.005 + 0.05 * time).r * 2.0 * 3.14;

    float windLeanAngle = remap(windStrength, 0.0, 1.0, 0.25, 1.0);
    windLeanAngle = easeIn(windLeanAngle, 2.0) * 0.75;

    // curved grass blade
    float leanAmount = 0.3;
    float curveAmount = leanAmount * position.y;
    float objectDistance = length(objectWorld - playerPosition);
    float objectCameraDistance = length(objectWorld - cameraPosition);

    // account for player presence
    vec3 playerDirection = (objectWorld - playerPosition) / objectDistance;
    float maxDistance = 3.0;
    float distance01 = objectDistance / maxDistance;
    float influence = 1.0 - smoothstep(0.0, 1.0, distance01);
    curveAmount += influence;
    curveAmount += windLeanAngle * smoothstep(0.2, 1.0, distance01);

    vec3 leanAxis = rotateAround(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), windDir * smoothstep(0.2, 1.0, distance01));
    leanAxis = normalize(mix(cross(vec3(0.0, 1.0, 0.0), playerDirection), leanAxis, smoothstep(0.0, 1.0, 1.0 - distance01)));

    float scaling = 1.0 + 0.3 * (texture2D(perlinNoise, objectWorld.xz * 0.1).r * 2.0 - 1.0);
    scaling *= 1.0 - smoothstep(70.0, 90.0, objectCameraDistance); // fade grass in the distance using scaling

    //vec3 terrainNormal = normalize(vec3(worldMatrix * vec4(0.0, 1.0, 0.0, 0.0)));
    vec3 sphereNormal = length(objectWorld - planetPosition) < 0.01 ? normalize(objectWorld - planetPosition) : vec3(0.0, 1.0, 0.0);
    
    // calculate the flatness of the terrain
    //float flatness = max(dot(terrainNormal, sphereNormal), 0.0);

    //scaling *= smoothstep(0.78, 0.8, flatness);

    // taller grass bends more than short grass
    curveAmount *= max(scaling, 0.3);

    vec3 leaningPosition = scaling * rotateAround(position, leanAxis, curveAmount);

    vec3 leaningNormal = rotateAround(normal, leanAxis, curveAmount);

    vec4 worldPosition = worldMatrix * vec4(leaningPosition, 1.0);

    //vec3 viewDir = normalize(cameraPosition - worldPosition);
    //float viewDotNormal = abs(dot(viewDir, leaningNormal));
    //float viewSpaceThickenFactor = easeOut(1.0 - viewDotNormal, 4.0);

    //viewSpaceThickenFactor *= smoothstep(0.0, 0.2, viewDotNormal);

    vec4 viewPosition = view * worldPosition;
    //viewPosition.x += viewSpaceThickenFactor * leaningNormal.y;

    vec4 outPosition = projection * viewPosition;
    gl_Position = outPosition;

    vPosition = position;
    vPositionW = worldPosition.xyz;

    vNormalW = vec3(worldMatrix * vec4(leaningNormal, 0.0));

    vPlanetNdl = 0.0;
    for(int i = 0; i < nbStars; i++) {
        vec3 starPosition = star_positions[i];
        vec3 lightDirectionW = normalize(starPosition - vPositionW);
        float ndl = dot(sphereNormal, lightDirectionW);

        vPlanetNdl = max(vPlanetNdl, ndl);
    }

    #ifdef FORDEPTH
    vDepthMetric = (-gl_Position.z + depthValues.x) / (depthValues.y);
    #endif
}