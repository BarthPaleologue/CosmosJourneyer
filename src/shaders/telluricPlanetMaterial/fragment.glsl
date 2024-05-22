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
varying vec3 vUnitSamplePoint;
varying vec3 vSphereNormalW;
varying vec3 vSamplePoint;
varying vec3 vSamplePointScaled;

varying vec3 vPosition;// position of the vertex varyingchunk
varying vec3 vNormal;// normal of the vertex varyingsphere space
varying vec3 vLocalPosition;

uniform mat4 normalMatrix;

varying vec3 cameraPosition;// camera position in world space
uniform float cameraNear;
uniform float cameraFar;

uniform vec3 planetPosition;

#define MAX_STARS 5
uniform int nbStars;// number of stars
uniform vec3 star_positions[MAX_STARS];
uniform vec3 star_colors[MAX_STARS];

uniform int colorMode;

uniform sampler2D lut; 

uniform sampler2D bottomNormalMap;

uniform sampler2D plainAlbedoMap;
uniform sampler2D plainNormalMap;
uniform sampler2D plainRoughnessMap;
uniform sampler2D plainMetallicMap;

uniform sampler2D beachNormalMap;

uniform sampler2D desertNormalMap;
uniform sampler2D desertAlbedoMap;
uniform sampler2D desertRoughnessMap;
uniform sampler2D desertMetallicMap;

uniform sampler2D snowNormalMap;

uniform sampler2D steepNormalMap;
uniform sampler2D steepAlbedoMap;
uniform sampler2D steepRoughnessMap;
uniform sampler2D steepMetallicMap;

uniform float seed;

uniform float planetRadius;// planet radius
uniform float waterLevel;// controls sand layer
uniform float beachSize;

uniform float steepSharpness;// sharpness of demaracation between steepColor and normal colors
uniform float normalSharpness;

uniform float maxElevation;

uniform vec3 snowColor;// the color of the snow layer
uniform vec3 steepColor;// the color of steep slopes
uniform vec3 plainColor;// the color of plains at the bottom of moutains
uniform vec3 beachColor;// the color of the sand
uniform vec3 desertColor;
uniform vec3 bottomColor;

uniform float pressure;
uniform float minTemperature;
uniform float maxTemperature;

uniform float waterAmount;


#include "../utils/toUV.glsl";

#include "../utils/triplanarNormal.glsl";

//https://www.desmos.com/calculator/8etk6vdfzi

#include "../utils/smoothSharpener.glsl";

#include "../utils/rayIntersectSphere.glsl";

vec3 saturate(vec3 color) {
    return clamp(color, 0.0, 1.0);
}

#include "./utils/waterBoilingPointCelsius.glsl";

#include "./utils/computeTemperature01.glsl";

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
    float latitude = acos(vUnitSamplePoint.y) - 3.1415 / 2.0;
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

    float waterMeltingPoint = 0.0;// fairly good approximation
    float waterMeltingPoint01 = (waterMeltingPoint - minTemperature) / (maxTemperature - minTemperature);
    float waterBoilingPoint01 = (waterBoilingPointCelsius(pressure) - minTemperature) / (maxTemperature - minTemperature);

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
    blendingNormal = triplanarNormal(vSamplePointScaled, blendingNormal, snowNormalMap, 0.0001 * 1000e3, normalSharpness, 1.0);


    // calcul de la couleur et de la normale
    /*vec3 normal = vNormal;

    float plainFactor = 0.0,
    desertFactor = 0.0,
    bottomFactor = 0.0,
    snowFactor = 0.0;

    // hard separation between wet and dry
    float moistureSharpness = 10.0;
    float moistureFactor = smoothSharpener(moisture01, moistureSharpness);

    vec3 plainColor = plainColor * (moisture01 * 0.5 + 0.5);

    float beachFactor = min(
    smoothstep(waterLevel01 - beachSize / maxElevation, waterLevel01, elevation01),
    smoothstep(waterLevel01 + beachSize / maxElevation, waterLevel01, elevation01)
    );
    beachFactor = smoothSharpener(beachFactor, 2.0);

    plainFactor = 1.0;//- steepFactor;

    // apply beach factor
    plainFactor *= 1.0 - beachFactor;
    //beachFactor *= 1.0 - steepFactor;

    // blend with desert factor when above water
    desertFactor = smoothstep(0.5, 0.3, moisture01);
    desertFactor = smoothSharpener(desertFactor, 2.0);
    plainFactor *= 1.0 - desertFactor;
    beachFactor *= 1.0 - desertFactor;

    // blend with snow factor when above water
    snowFactor = smoothstep(0.0, -2.0, temperature - abs(0.3 * (blendingNormal.z + blendingNormal.x + blendingNormal.y)) * 5.0);
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

    // blend with bottom factor when under water
    bottomFactor = smoothstep(waterLevel01, waterLevel01 - 1e-2, elevation01);
    bottomFactor = smoothSharpener(bottomFactor, 2.0);
    plainFactor *= 1.0 - bottomFactor;
    beachFactor *= 1.0 - bottomFactor;
    snowFactor *= 1.0 - bottomFactor;
    desertFactor *= 1.0 - bottomFactor;

    // template:
    // small scale
    // large scale

    float normalStrengthNear = 1.0;
    float normalStrengthFar = 1.0;

    normalStrengthFar = smoothstep(0.0, 1.0, pow(length(cameraPosition - vPositionW) / 5e3, 2.0));
    normalStrengthNear = 1.0 - normalStrengthFar;

    const float nearScale = 0.3 * 1000e3;
    const float farScale = 0.00001 * 1000e3;

    normal = triplanarNormal(vSamplePointScaled, normal, bottomNormalMap, nearScale, normalSharpness, bottomFactor * normalStrengthNear);
    normal = triplanarNormal(vSamplePointScaled, normal, bottomNormalMap, farScale, normalSharpness, bottomFactor * normalStrengthFar);

    normal = triplanarNormal(vSamplePointScaled, normal, beachNormalMap, nearScale, normalSharpness, beachFactor * normalStrengthNear);
    normal = triplanarNormal(vSamplePointScaled, normal, beachNormalMap, farScale, normalSharpness, beachFactor * normalStrengthFar);

    normal = triplanarNormal(vSamplePointScaled, normal, plainNormalMap, nearScale, normalSharpness, plainFactor * normalStrengthNear);
    normal = triplanarNormal(vSamplePointScaled, normal, plainNormalMap, farScale, normalSharpness, plainFactor * normalStrengthFar);

    normal = triplanarNormal(vSamplePointScaled, normal, desertNormalMap, nearScale, normalSharpness, desertFactor * normalStrengthNear);
    normal = triplanarNormal(vSamplePointScaled, normal, desertNormalMap, farScale, normalSharpness, desertFactor * normalStrengthFar);

    normal = triplanarNormal(vSamplePointScaled, normal, snowNormalMap, nearScale, normalSharpness, snowFactor * normalStrengthNear);
    normal = triplanarNormal(vSamplePointScaled, normal, snowNormalMap, farScale, normalSharpness, snowFactor * normalStrengthFar);

    normal = triplanarNormal(vSamplePointScaled, normal, steepNormalMap, nearScale, normalSharpness, steepFactor * normalStrengthNear);
    normal = triplanarNormal(vSamplePointScaled, normal, steepNormalMap, farScale, normalSharpness, steepFactor * normalStrengthFar);

    normal = normalize(normal);

    vec3 color = steepFactor * steepColor
    + beachFactor * beachColor
    + desertFactor * desertColor
    + plainFactor * plainColor
    + snowFactor * snowColor
    + bottomFactor * bottomColor;*/

    float scale = 0.5 * 1000e3;
    float sharpness = 1.0;
    float normalStrength = 1.0;
    vec3 albedo;
    vec3 normal = vNormal;
    float roughness, metallic;
    triPlanarMaterial(vSamplePointScaled, normal, steepAlbedoMap, steepNormalMap, steepRoughnessMap, steepMetallicMap, scale, sharpness, normalStrength, albedo, normal, roughness, metallic);

    vec3 color = albedo;

    vec3 normalW = mat3(normalMatrix) * normal;


    vec3 ndl2 = vec3(0.0);// dimming factor due to light inclination relative to vertex normal in world space
    vec3 specComp = vec3(0.0);
    for (int i = 0; i < nbStars; i++) {
        vec3 starLightRayW = normalize(star_positions[i] - vPositionW);
        vec3 ndl2part = max(0.0, dot(normalW, starLightRayW)) * star_colors[i];
        ndl2 += ndl2part;

        vec3 angleW = normalize(viewRayW + starLightRayW);
        specComp += max(0.0, dot(normalW, angleW)) * star_colors[i];
    }
    ndl2 = saturate(ndl2);
    specComp = saturate(specComp);
    specComp = pow(specComp, vec3(32.0));

    // TODO: finish this (uniforms...)
    //float smoothness = 0.7;
    //float specularAngle = fastAcos(dot(normalize(viewRayW + lightRayW), normalW));
    //float specularExponent = specularAngle / (1.0 - smoothness);
    //float specComp = exp(-specularExponent * specularExponent);

    // suppresion du reflet partout hors la neige
    specComp *= (color.r + color.g + color.b) / 3.0;
    specComp /= 2.0;

    vec3 screenColor = color.rgb * (ndl2 + specComp*ndl1);

    if (colorMode == 1) screenColor = mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), moisture01);
    if (colorMode == 2) screenColor = mix(vec3(0.1, 0.2, 1.0), vec3(1.0, 0.0, 0.0), temperature01);
    if (colorMode == 3) screenColor = normal * 0.5 + 0.5;
    if (colorMode == 4) screenColor = vec3(elevation01);
    if (colorMode == 5) screenColor = vec3(1.0 - dot(normal, normalize(vSamplePoint)));
    if (colorMode == 6) screenColor = vec3(1.0 - slope);

    gl_FragColor = vec4(screenColor, 1.0);// apply color and lighting
} 