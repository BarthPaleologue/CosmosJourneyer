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

#define DISABLE_UNIFORMITY_ANALYSIS

uniform mat4 world;

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec3 vUnitSamplePoint;
varying vec3 vSphereNormalW;
varying vec3 vSamplePoint;

varying vec3 vPosition;// position of the vertex varyingchunk
varying vec3 vNormal;// normal of the vertex varyingsphere space

uniform vec3 cameraPosition;// camera position in world space

#define MAX_STARS 5
uniform int nbStars;// number of stars
uniform vec3 star_positions[MAX_STARS];
uniform vec3 star_colors[MAX_STARS];

uniform int colorMode;

uniform sampler2D lut;

uniform sampler2D plainAlbedoRoughnessMap;
uniform sampler2D plainNormalMetallicMap;

uniform sampler2D desertNormalMetallicMap;
uniform sampler2D desertAlbedoRoughnessMap;

uniform sampler2D snowNormalMetallicMap;
uniform sampler2D snowAlbedoRoughnessMap;

uniform sampler2D steepNormalMetallicMap;
uniform sampler2D steepAlbedoRoughnessMap;

uniform float planetRadius;// planet radius
uniform float waterLevel;// controls sand layer
uniform float beachSize;

uniform float steepSharpness;// sharpness of demaracation between steepColor and normal colors

uniform float maxElevation;

uniform float pressure;
uniform float minTemperature;
uniform float maxTemperature;

uniform float waterAmount;

#include "../utils/pi.glsl";

#include "../utils/toUV.glsl";

#include "../utils/textureNoTile.glsl";

#include "../utils/triplanarNormal.glsl";

//https://www.desmos.com/calculator/8etk6vdfzi

#include "../utils/smoothSharpener.glsl";

#include "../utils/rayIntersectSphere.glsl";

vec3 saturate(vec3 color) {
    return clamp(color, 0.0, 1.0);
}

#include "./utils/waterBoilingTemperature.glsl";

#include "./utils/computeTemperature01.glsl";

#include "../utils/pbr.glsl";

void main() {
    vec3 viewRayW = normalize(cameraPosition - vPositionW);// view direction in world space

    vec3 sphereNormalW = vSphereNormalW;

    // diffuse lighting extinction
    float ndl1 = 0.0;
    for (int i = 0; i < nbStars; i++) {
        vec3 starLightRayW = normalize(star_positions[i] - vPositionW);// light ray direction in world space
        ndl1 += max(dot(sphereNormalW, starLightRayW), 0.0);
    }
    ndl1 = clamp(ndl1, 0.0, 1.0);

    //FIXME: should use the angle between the axis and the normal
    float latitude = acos(clamp(vUnitSamplePoint.y, -1.0, 1.0)) - 3.1415 / 2.0;
    //float latitude = vUnitSamplePoint.y;
    float absLatitude01 = abs(latitude);

    float elevation = length(vPosition) - planetRadius;

    float elevation01 = elevation / maxElevation;
    float waterLevel01 = waterLevel / maxElevation;

    float slope = 1.0 - abs(dot(vUnitSamplePoint, vNormal));

    /// Analyse Physique de la planète

    float dayDuration = 1.0;

    // pressions
    //float waterSublimationPression = 0.006; //https://www.wikiwand.com/en/Sublimation_(phase_transition)#/Water

    // Temperatures

    float waterMeltingPoint = 273.15; // fairly good approximation
    float waterMeltingPoint01 = (waterMeltingPoint - minTemperature) / (maxTemperature - minTemperature);
    float waterBoilingPoint01 = (waterBoilingTemperature(pressure) - minTemperature) / (maxTemperature - minTemperature);

    //https://qph.fs.quoracdn.net/main-qimg-6a0fa3c05fb4db3d7d081680aec4b541
    //float co2SublimationTemperature = 0.0; // https://www.wikiwand.com/en/Sublimation_(phase_transition)#/CO2
    // TODO: find the equation ; even better use a texture
    //float co2SublimationTemperature01 = (co2SublimationTemperature - minTemperature) / (maxTemperature - minTemperature);

    float temperature01 = computeTemperature01(elevation01, absLatitude01, ndl1, dayDuration);

    float temperature = mix(minTemperature, maxTemperature, temperature01);

    vec2 uv = toUV(vUnitSamplePoint);
    // trick from https://www.shadertoy.com/view/3dVSzm to avoid Greenwich artifacts
    vec2 df = fwidth(uv);
    if (df.x > 0.5) df.x = 0.0;
    vec4 lutResult = textureLod(lut, uv, log2(max(df.x, df.y) * 1024.0));

    // moisture
    float moisture01 = 0.0;// 0.0 = sec, 1.0 = humid : sec par défaut
    if (waterMeltingPoint01 < 1.0) {
        // if there is liquid water on the surface
        moisture01 += lutResult.x;
    }
    if (pressure == 0.0) {
        moisture01 += lutResult.y;
    }
    moisture01 = clamp(moisture01, 0.0, 1.0);


    vec3 blendingNormal = vNormal;

    // calcul de la couleur et de la normale
    float plainFactor = 0.0,
    desertFactor = 0.0,
    snowFactor = 0.0;

    // hard separation between wet and dry
    float moistureSharpness = 10.0;
    float moistureFactor = smoothSharpener(moisture01, moistureSharpness);

    float beachFactor = smoothstep(waterLevel01 + beachSize / maxElevation, waterLevel01, elevation01);
    beachFactor = smoothSharpener(beachFactor, 2.0);

    plainFactor = 1.0;//- steepFactor;

    // apply beach factor
    plainFactor *= 1.0 - beachFactor;
    //beachFactor *= 1.0 - steepFactor;

    // blend with desert factor when above water
    desertFactor = 1.0 - smoothstep(0.3, 0.5, moisture01);
    desertFactor = smoothSharpener(desertFactor, 2.0);
    plainFactor *= 1.0 - desertFactor;
    beachFactor *= 1.0 - desertFactor;

    // blend with snow factor when above water
    snowFactor = 1.0 - smoothstep(-2.0, 0.0, temperature - abs(0.3 * (blendingNormal.z + blendingNormal.x + blendingNormal.y)) * 5.0);
    snowFactor = smoothSharpener(snowFactor, 2.0);
    plainFactor *= 1.0 - snowFactor;
    beachFactor *= 1.0 - snowFactor;
    desertFactor *= 1.0 - snowFactor;

    float steepFactor = slope;
    steepFactor = smoothstep(0.05, 0.3, steepFactor);
    steepFactor = smoothSharpener(steepFactor, steepSharpness);
    snowFactor *= 1.0 - steepFactor;
    plainFactor *= 1.0 - steepFactor;
    beachFactor *= 1.0 - steepFactor;
    desertFactor *= 1.0 - steepFactor;

    float scale = 0.05;

    // Steep material
    float steepScale = scale;
    vec3 steepAlbedo;
    vec3 steepNormal = vNormal;
    float steepRoughness, steepMetallic;
    if (steepFactor > 0.01) {
        triPlanarMaterial(vSamplePoint, vNormal, steepAlbedoRoughnessMap, steepNormalMetallicMap, steepScale, steepAlbedo, steepNormal, steepRoughness, steepMetallic);
    }

    // Plain material
    float plainScale = scale;
    vec3 plainAlbedo;
    vec3 plainNormal = vNormal;
    float plainRoughness, plainMetallic;
    if (plainFactor > 0.01) {
        triPlanarMaterial(vSamplePoint, vNormal, plainAlbedoRoughnessMap, plainNormalMetallicMap, plainScale, plainAlbedo, plainNormal, plainRoughness, plainMetallic);
    }

    // Desert material
    float desertScale = scale;
    vec3 desertAlbedo;
    vec3 desertNormal = vNormal;
    float desertRoughness, desertMetallic;
    if (desertFactor + beachFactor > 0.01) {
        triPlanarMaterial(vSamplePoint, vNormal, desertAlbedoRoughnessMap, desertNormalMetallicMap, desertScale, desertAlbedo, desertNormal, desertRoughness, desertMetallic);
    }

    // Snow material
    float snowScale = scale;
    vec3 snowAlbedo;
    vec3 snowNormal = vNormal;
    float snowRoughness, snowMetallic;
    if (snowFactor > 0.01) {
        triPlanarMaterial(vSamplePoint, vNormal, snowAlbedoRoughnessMap, snowNormalMetallicMap, snowScale, snowAlbedo, snowNormal, snowRoughness, snowMetallic);
    }

    vec3 albedo = steepFactor * steepAlbedo + plainFactor * plainAlbedo + (desertFactor+beachFactor) * desertAlbedo + snowFactor * snowAlbedo;

    vec3 normal = steepFactor * steepNormal + plainFactor * plainNormal + (desertFactor+beachFactor) * desertNormal + snowFactor * snowNormal;
    normal = normalize(normal);

    float roughness = steepFactor * steepRoughness + plainFactor * plainRoughness + (desertFactor+beachFactor) * desertRoughness + snowFactor * snowRoughness;

    float metallic = steepFactor * steepMetallic + plainFactor * plainMetallic + (desertFactor+beachFactor) * desertMetallic + snowFactor * snowMetallic;

    vec3 normalW = vNormalW;

    // pbr accumulation
    vec3 Lo = vec3(0.0);
    vec3 V = normalize(cameraPosition - vPositionW);
    for (int i = 0; i < nbStars; i++) {
        vec3 L = normalize(star_positions[i] - vPositionW);

        Lo += calculateLight(albedo, normalW, roughness, metallic, L, V, star_colors[i]);
    }

    Lo = pow(Lo, vec3(1.0 / 2.2));

    vec3 screenColor = Lo;

    if (colorMode == 1) screenColor = mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), moisture01);
    if (colorMode == 2) screenColor = mix(vec3(0.1, 0.2, 1.0), vec3(1.0, 0.0, 0.0), temperature01);
    if (colorMode == 3) screenColor = normal * 0.5 + 0.5;
    if (colorMode == 4) screenColor = vec3(elevation01);
    if (colorMode == 5) screenColor = vec3(1.0 - dot(normal, normalize(vPosition)));
    if (colorMode == 6) screenColor = vec3(1.0 - slope);

    gl_FragColor = vec4(screenColor, 1.0);// apply color and lighting
} 