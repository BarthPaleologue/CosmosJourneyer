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

// taken from https://github.com/BarthPaleologue/feather/blob/main/assets/shaders/pbr/fragment.glsl
// based on https://learnopengl.com/PBR/Lighting

#include "./pi.glsl";

float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a      = roughness*roughness;
    float a2     = a*a;
    float NdotH  = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;

    float num   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return num / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float num   = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return num / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2  = GeometrySchlickGGX(NdotV, roughness);
    float ggx1  = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 calculateLight(vec3 albedo, vec3 normal, float roughness, float metallic, vec3 lightDir, vec3 viewDir, vec3 lightColor) {
    vec3 H = normalize(viewDir + lightDir);

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    vec3 F  = fresnelSchlick(max(dot(H, viewDir), 0.0), F0);
    float NDF = DistributionGGX(normal, H, roughness);
    float G   = GeometrySmith(normal, viewDir, lightDir, roughness);

    vec3 numerator    = NDF * G * F;
    float denominator = 4.0 * max(dot(normal, viewDir), 0.0) * max(dot(normal, lightDir), 0.0)  + 1.0; // + 1.0 to prevent division by zero at glancing angles
    vec3 specular     = numerator / denominator;

    vec3 kS = F;
    vec3 kD = 1.0 - kS;

    kD *= 1.0 - metallic;

    vec3 radiance = lightColor;

    float NdotL = max(dot(normal, lightDir), 0.0);

    vec3 diffuse = kD * (albedo)/ PI;
    return (diffuse + specular) * radiance * NdotL;
}