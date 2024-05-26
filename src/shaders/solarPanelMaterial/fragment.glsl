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

uniform sampler2D albedoMap;
uniform sampler2D normalMap;
uniform sampler2D metallicMap;
uniform sampler2D roughnessMap;

uniform vec3 cameraPosition;

#include "../utils/pi.glsl";

#include "../utils/stars.glsl";

#include "../utils/remap.glsl";

#include "../utils/textureNoTile.glsl";

#include "../utils/pbr.glsl";

void main() {
    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

    vec2 vUV = vPosition.xy * 0.01;

    vec3 albedo = texture2D(albedoMap, vUV).rgb;
    float roughness = textureNoTile(roughnessMap, vUV).r;
    float metallic = textureNoTile(metallicMap, vUV).r;

    vec3 tangent1 = normalize(dFdx(vPositionW));
    vec3 tangent2 = normalize(dFdy(vPositionW));
    vec3 normalW = normalize(vNormalW);
    vec3 bitangent = cross(normalW, tangent1);
    mat3 TBN = mat3(tangent1, tangent2, normalW);

    vec3 normalMap = texture2D(normalMap, vUV).rgb;
    normalMap = normalize(normalMap * 2.0 - 1.0);
    normalW = normalize(TBN * normalMap);

    vec3 Lo = vec3(0.0);
    for(int i = 0; i < nbStars; i++) {
        vec3 lightDirectionW = normalize(star_positions[i] - vPositionW);
        Lo += calculateLight(albedo, normalW, roughness, metallic, lightDirectionW, viewDirectionW, star_colors[i]);
    }

    gl_FragColor = vec4(Lo, 1.0);
}