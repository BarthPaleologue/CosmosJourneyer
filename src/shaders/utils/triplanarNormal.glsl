//  This file is part of CosmosJourneyer
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

// https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a
#define inline
vec3 triplanarNormal(vec3 position, vec3 surfaceNormal, sampler2D normalMap, float scale, float sharpness, float normalStrength) {
    vec2 uvX = vec3(position).zy * scale;
    vec2 uvY = vec3(position).xz * scale;
    vec2 uvZ = vec3(position).xy * scale;

    // get the normal from the normal map

    vec3 tNormalX = texture2D(normalMap, uvX).rgb;
    vec3 tNormalY = texture2D(normalMap, uvY).rgb;
    vec3 tNormalZ = texture2D(normalMap, uvZ).rgb;

    tNormalX = normalize(tNormalX * 2.0 - 1.0);
    tNormalY = normalize(tNormalY * 2.0 - 1.0);
    tNormalZ = normalize(tNormalZ * 2.0 - 1.0);

    // Swizzle tangemt normals into world space and zero out "z"
    tNormalX = vec3(0.0, tNormalX.yx);
    tNormalY = vec3(tNormalY.x, 0.0, tNormalY.y);
    tNormalZ = vec3(tNormalZ.xy, 0.0);

    vec3 blendWeight = pow(abs(surfaceNormal), vec3(sharpness));
    blendWeight /= (blendWeight.x + blendWeight.y + blendWeight.z);
    blendWeight *= normalStrength;

    // Triblend normals and add to world normal
    return normalize(
        tNormalX.xyz * blendWeight.x +
        tNormalY.xyz * blendWeight.y +
        tNormalZ.xyz * blendWeight.z +
        surfaceNormal
    );
}