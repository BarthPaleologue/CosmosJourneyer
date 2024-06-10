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

#include "../utils/pbr.glsl";

#define inline
void triPlanarMaterial(vec3 position, vec3 surfaceNormal, sampler2D albedoMap, sampler2D roughnessMap, sampler2D normalMap, sampler2D metallicMap, float scale, out vec3 albedo, out vec3 normal, out float roughness, out float metallic) {
    vec2 uvX = vec3(position).zy * scale;
    vec2 uvY = vec3(position).xz * scale;
    vec2 uvZ = vec3(position).xy * scale;

    // get the normal from the normal map
    vec3 tNormalX = texture(normalMap, uvX).rgb;
    vec3 tNormalY = texture(normalMap, uvY).rgb;
    vec3 tNormalZ = texture(normalMap, uvZ).rgb;

    tNormalX = tNormalX * 2.0 - 1.0;
    tNormalY = tNormalY * 2.0 - 1.0;
    tNormalZ = tNormalZ * 2.0 - 1.0;

    vec3 blendWeight = abs(surfaceNormal);
    blendWeight = pow(blendWeight, vec3(2.0));
    blendWeight /= (blendWeight.x + blendWeight.y + blendWeight.z);

    // Swizzle world normals into tangent space and apply Whiteout blend
    tNormalX = vec3(tNormalX.xy + surfaceNormal.zy, abs(tNormalX.z) * surfaceNormal.x);
    tNormalY = vec3(tNormalY.xy + surfaceNormal.xz, abs(tNormalY.z) * surfaceNormal.y);
    tNormalZ = vec3(tNormalZ.xy + surfaceNormal.xy, abs(tNormalZ.z) * surfaceNormal.z);

    normal = normalize(
    tNormalX.zyx * blendWeight.x +
    tNormalY.xzy * blendWeight.y +
    tNormalZ.xyz * blendWeight.z
    );

    // tri planar mapping of albedo
    float gamma = 2.2;
    vec3 tAlbedoX = pow(texture(albedoMap, uvX).rgb, vec3(gamma));
    vec3 tAlbedoY = pow(texture(albedoMap, uvY).rgb, vec3(gamma));
    vec3 tAlbedoZ = pow(texture(albedoMap, uvZ).rgb, vec3(gamma));

    albedo =
    tAlbedoX * blendWeight.x +
    tAlbedoY * blendWeight.y +
    tAlbedoZ * blendWeight.z;

    // tri planar mapping of roughness
    float tRoughnessX = texture(roughnessMap, uvX).r;
    float tRoughnessY = texture(roughnessMap, uvY).r;
    float tRoughnessZ = texture(roughnessMap, uvZ).r;

    roughness =
    tRoughnessX * blendWeight.x +
    tRoughnessY * blendWeight.y +
    tRoughnessZ * blendWeight.z;

    // tri planar mapping of metallic
    float tMetallicX = texture(metallicMap, uvX).r;
    float tMetallicY = texture(metallicMap, uvY).r;
    float tMetallicZ = texture(metallicMap, uvZ).r;

    metallic =
    tMetallicX * blendWeight.x +
    tMetallicY * blendWeight.y +
    tMetallicZ * blendWeight.z;
}

void main() {
    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

    vec3 albedo = vec3(0.0);
    vec3 normalW = vec3(0.0);
    float roughness = 0.0;
    float metallic = 0.0;
    
    triPlanarMaterial(vPosition, vNormalW, albedoMap, roughnessMap, normalMap, metallicMap, 0.01, albedo, normalW, roughness, metallic);

    vec3 Lo = vec3(0.0);
    for(int i = 0; i < nbStars; i++) {
        vec3 lightDirectionW = normalize(star_positions[i] - vPositionW);
        Lo += calculateLight(albedo, normalW, roughness, metallic, lightDirectionW, viewDirectionW, star_colors[i]);
    }

    Lo = pow(Lo, vec3(1.0 / 2.2));

    gl_FragColor = vec4(Lo, 1.0);
}