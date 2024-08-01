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

varying vec3 vPositionW;
varying mat3 vTBN;
varying vec3 vPosition;
varying vec2 vUV;

uniform sampler2D albedoMap;
uniform sampler2D normalMap;
uniform sampler2D metallicMap;
uniform sampler2D roughnessMap;
uniform sampler2D numberTexture;

uniform vec3 cameraPosition;
uniform float aspectRatio;

#include "../utils/stars.glsl";

#include "../utils/pbr.glsl";

void main() {
    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

    vec2 uv = vec2(fract(vPosition.x / 10.0), fract(vPosition.z / 10.0));

    vec3 normalFromMap = texture(normalMap, uv).rgb;
    normalFromMap.y = 1.0 - normalFromMap.y;
    normalFromMap = normalFromMap * 2.0 - 1.0;
    vec3 normalW = normalize(vTBN * normalFromMap);

    vec3 albedo = pow(texture(albedoMap, uv).rgb, vec3(2.2));
    float roughness = texture(roughnessMap, uv).r;
    float metallic = texture(metallicMap, uv).r;

    float paintWeight = texture(numberTexture, vec2(vUV.y, vUV.x + 0.03)).a;
    vec3 paintColor = vec3(1.0);
    float borderThickness = 0.03;
    if(vUV.x < borderThickness || vUV.x > (1.0 - borderThickness) || vUV.y < borderThickness * aspectRatio || vUV.y > (1.0 - borderThickness * aspectRatio)) {
        paintWeight = 1.0;
    }

    vec2 centeredUV = vUV - vec2(0.5);
    centeredUV.x *= aspectRatio;

    float radius = 0.25;
    float circleThickness = 0.01;
    if(length(centeredUV) > radius - circleThickness && length(centeredUV) < radius + circleThickness) {
        paintWeight = 1.0;
    }

    albedo = mix(albedo, paintColor, paintWeight);
    metallic = mix(metallic, 0.0, paintWeight);
    roughness = mix(roughness, 0.7, paintWeight);
    normalW = mix(normalW, vTBN[2], paintWeight * 0.5);

    vec3 Lo = vec3(0.0);
    for(int i = 0; i < nbStars; i++) {
        vec3 lightDirectionW = normalize(star_positions[i] - vPositionW);
        Lo += calculateLight(albedo, normalW, roughness, metallic, lightDirectionW, viewDirectionW, star_colors[i]);
    }

    Lo = pow(Lo, vec3(1.0 / 2.2));

    gl_FragColor = vec4(Lo, 1.0);
}