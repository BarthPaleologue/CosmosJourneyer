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
varying vec3 vNormalW;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;

uniform sampler2D albedo;
uniform sampler2D normal;
uniform sampler2D metallic;
uniform sampler2D roughness;
uniform sampler2D occlusion;

uniform sampler2D namePlate;

uniform float deltaRadius;
uniform float meanRadius;

uniform vec3 cameraPosition;

#include "../utils/stars.glsl";

#include "../utils/pbr.glsl";

#include "../utils/pi.glsl";

#include "../utils/remap.glsl";

float atan2(in float y, in float x) {
    bool s = (abs(x) > abs(y));
    return mix(PI/2.0 - atan(x,y), atan(y,x), s);
}

void main() {
    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

    float gamma = 2.2;

    vec3 albedoColor = pow(texture2D(albedo, vUV).rgb, vec3(gamma));
    float roughnessColor = texture2D(roughness, vUV).r;
    float metallicColor = texture2D(metallic, vUV).r;
    float occlusionColor = texture2D(occlusion, vUV).r;

    vec3 tangent1 = normalize(dFdx(vPositionW));
    vec3 tangent2 = normalize(dFdy(vPositionW));
    vec3 normalW = normalize(vNormalW);
    vec3 bitangent = cross(normalW, tangent1);
    mat3 TBN = mat3(tangent1, tangent2, normalW);

    vec3 normalMap = texture2D(normal, vUV).rgb;
    normalMap = normalize(normalMap * 2.0 - 1.0);
    normalW = normalize(TBN * normalMap);


    vec2 planarPosition = normalize(vPosition.xz);
    float theta = atan2(planarPosition.y, planarPosition.x);
    float distanceToCenter = length(vPosition.xz);
    distanceToCenter = remap(distanceToCenter, meanRadius - deltaRadius / 2.0, meanRadius + deltaRadius / 2.0, 0.0, 1.0);

    vec2 namePlateUV = vec2(theta / (PI), distanceToCenter);
    if (vNormal.y < 1.0) {
        namePlateUV *= 0.0;
    }

    vec4 namePlate = texture2D(namePlate, fract(namePlateUV));
    float paintWeight = namePlate.a;

    albedoColor = mix(albedoColor, namePlate.rgb, paintWeight);
    metallicColor = mix(metallicColor, 0.0, paintWeight);
    roughnessColor = mix(roughnessColor, 0.7, paintWeight);
    normalW = mix(normalW, TBN[2], paintWeight * 0.7);

    vec3 Lo = vec3(0.0);
    for(int i = 0; i < nbStars; i++) {
        vec3 lightDirectionW = normalize(star_positions[i] - vPositionW);
        Lo += calculateLight(albedoColor, normalW, roughnessColor, metallicColor, lightDirectionW, viewDirectionW, star_colors[i]);
    }

    Lo += smoothstep(0.48, 0.5, fract(vUV.x)) * smoothstep(0.52, 0.5, fract(vUV.x)) * smoothstep(0.4, 0.45, fract(vUV.y)) * smoothstep(0.6, 0.55, fract(vUV.y)) * vec3(1.0, 1.0, 0.4);

    // occlusion
    //Lo *= mix(1.0, occlusionColor, 0.5);

    Lo = pow(Lo, vec3(1.0 / gamma));

    gl_FragColor = vec4(Lo, 1.0);
}