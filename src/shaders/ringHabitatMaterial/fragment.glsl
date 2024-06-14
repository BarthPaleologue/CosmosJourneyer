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

    vec2 ringUV = vec2(10.0 * theta, vUV.y);

    float gamma = 2.2;

    vec3 albedoColor = pow(texture2D(albedo, ringUV).rgb, vec3(gamma));
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
    for(int i = 0; i < nbStars; i++) {
        vec3 lightDirectionW = normalize(star_positions[i] - vPositionW);
        Lo += calculateLight(albedoColor, normalW, roughnessColor, metallicColor, lightDirectionW, viewDirectionW, star_colors[i]);
    }

    Lo += smoothstep(0.48, 0.5, ringUV.y) * smoothstep(0.52, 0.5, ringUV.y) * smoothstep(0.4, 0.45, fract(ringUV.x)) * smoothstep(0.6, 0.55, fract(ringUV.x)) * vec3(1.0, 1.0, 0.4);

    // occlusion
    //Lo *= mix(1.0, occlusionColor, 0.5);

    Lo = pow(Lo, vec3(1.0/gamma));

    gl_FragColor = vec4(Lo, 1.0);
}