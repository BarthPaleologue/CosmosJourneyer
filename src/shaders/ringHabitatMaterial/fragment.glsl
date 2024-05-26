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

uniform sampler2D perlin;

uniform vec3 cameraPosition;

#include "../utils/pi.glsl";

#include "../utils/stars.glsl";

float atan2(in float y, in float x) {
    bool s = (abs(x) > abs(y));
    return mix(PI/2.0 - atan(x,y), atan(y,x), s);
}

#include "../utils/remap.glsl";

#include "../utils/pbr.glsl";

#include "../utils/textureNoTile.glsl";

void main() {
    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

    float theta = atan2(vPosition.z, vPosition.x);

    theta = remap(theta, 0.0, 1.0, -3.14/2.0, 3.14/2.0);

    vec2 ringUV = vec2(theta, vUV.y);

    vec3 albedoColor = 1.0 - texture2D(albedo, ringUV).rgb;
    float roughnessColor = texture2D(roughness, ringUV).r;
    float metallicColor = texture2D(metallic, ringUV).r;
    float occlusionColor = texture2D(occlusion, ringUV).r;

    vec3 tangent1 = normalize(dFdx(vPositionW));
    vec3 tangent2 = normalize(dFdy(vPositionW));
    vec3 normalW = normalize(vNormalW);
    vec3 bitangent = cross(normalW, tangent1);
    mat3 TBN = mat3(tangent1, tangent2, normalW);

    vec3 normalMap = texture2D(normal, ringUV).rgb;
    normalMap = normalize(normalMap * 2.0 - 1.0);
    normalW = normalize(TBN * normalMap);

    vec3 Lo = vec3(0.0);
    /*for(int i = 0; i < nbStars; i++) {
        vec3 lightDirectionW = normalize(star_positions[i] - vPositionW);
        Lo += calculateLight(albedoColor, vNormalW, roughnessColor, metallicColor, lightDirectionW, viewDirectionW, star_colors[i]);
    }*/

    vec3 lightDirectionW = vec3(0.0, 1.0, 0.0);
    Lo += calculateLight(albedoColor, normalW, roughnessColor, metallicColor, lightDirectionW, viewDirectionW, vec3(1.0));

    float noiseValue = textureNoTile(perlin, ringUV).r;
    Lo += (smoothstep(0.75, 0.75, noiseValue) + smoothstep(0.75, 0.75, 1.0 - noiseValue)) * vec3(1.0, 1.0, 0.4) * 2.0;

    gl_FragColor = vec4(Lo, 1.0);
}