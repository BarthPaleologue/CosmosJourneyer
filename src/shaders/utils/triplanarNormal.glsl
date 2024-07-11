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

// https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a
#define inline
vec3 triplanarNormal(vec3 position, vec3 surfaceNormal, sampler2D normalMap, float scale) {
    vec2 uvX = vec3(position).zy * scale;
    vec2 uvY = vec3(position).xz * scale;
    vec2 uvZ = vec3(position).xy * scale;

    vec3 blendWeight = pow(abs(surfaceNormal), vec3(2.0));
    blendWeight /= (blendWeight.x + blendWeight.y + blendWeight.z);

    // get the normal from the normal map

    vec3 tNormalX = textureNoTile(normalMap, uvX).rgb;
    vec3 tNormalY = textureNoTile(normalMap, uvY).rgb;
    vec3 tNormalZ = textureNoTile(normalMap, uvZ).rgb;

    tNormalX.g = 1.0 - tNormalX.g;
    tNormalY.g = 1.0 - tNormalY.g;
    tNormalZ.g = 1.0 - tNormalZ.g;

    tNormalX = tNormalX * 2.0 - 1.0;
    tNormalY = tNormalY * 2.0 - 1.0;
    tNormalZ = tNormalZ * 2.0 - 1.0;

    // Swizzle world normals into tangent space and apply Whiteout blend
    tNormalX = vec3(tNormalX.xy + surfaceNormal.zy, abs(tNormalX.z) * surfaceNormal.x);
    tNormalY = vec3(tNormalY.xy + surfaceNormal.xz, abs(tNormalY.z) * surfaceNormal.y);
    tNormalZ = vec3(tNormalZ.xy + surfaceNormal.xy, abs(tNormalZ.z) * surfaceNormal.z);

    // Swizzle tangent normals to match world orientation and triblend
    return normalize(
    tNormalX.zyx * blendWeight.x +
    tNormalY.xzy * blendWeight.y +
    tNormalZ.xyz * blendWeight.z
    );
}

#define inline
void triPlanarMaterial(vec3 position, vec3 surfaceNormal, sampler2D albedoRoughnessMap, sampler2D normalMetallicMap, float scale, out vec3 albedo, out vec3 normal, out float roughness, out float metallic) {
    vec2 uvX = vec3(position).zy * scale;
    vec2 uvY = vec3(position).xz * scale;
    vec2 uvZ = vec3(position).xy * scale;

    // get the normal from the normal map
    vec4 tNormalMetallicX = textureNoTile(normalMetallicMap, uvX);
    vec4 tNormalMetallicY = textureNoTile(normalMetallicMap, uvY);
    vec4 tNormalMetallicZ = textureNoTile(normalMetallicMap, uvZ);

    vec3 tNormalX = tNormalMetallicX.rgb;
    vec3 tNormalY = tNormalMetallicY.rgb;
    vec3 tNormalZ = tNormalMetallicZ.rgb;

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
    vec4 tAlbedoRoughnessX = textureNoTile(albedoRoughnessMap, uvX);
    vec4 tAlbedoRoughnessY = textureNoTile(albedoRoughnessMap, uvY);
    vec4 tAlbedoRoughnessZ = textureNoTile(albedoRoughnessMap, uvZ);

    float gamma = 2.2;
    vec3 tAlbedoX = pow(tAlbedoRoughnessX.rgb, vec3(gamma));
    vec3 tAlbedoY = pow(tAlbedoRoughnessY.rgb, vec3(gamma));
    vec3 tAlbedoZ = pow(tAlbedoRoughnessZ.rgb, vec3(gamma));

    albedo =
    tAlbedoX * blendWeight.x +
    tAlbedoY * blendWeight.y +
    tAlbedoZ * blendWeight.z;

    // tri planar mapping of roughness
    float tRoughnessX = tAlbedoRoughnessX.a;
    float tRoughnessY = tAlbedoRoughnessY.a;
    float tRoughnessZ = tAlbedoRoughnessZ.a;

    roughness =
    tRoughnessX * blendWeight.x +
    tRoughnessY * blendWeight.y +
    tRoughnessZ * blendWeight.z;

    // tri planar mapping of metallic
    float tMetallicX = tNormalMetallicX.a;
    float tMetallicY = tNormalMetallicY.a;
    float tMetallicZ = tNormalMetallicZ.a;

    metallic =
    tMetallicX * blendWeight.x +
    tMetallicY * blendWeight.y +
    tMetallicZ * blendWeight.z;
}