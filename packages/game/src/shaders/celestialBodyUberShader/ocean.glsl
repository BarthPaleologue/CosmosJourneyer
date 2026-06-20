//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

uniform mat4 planetInverseRotationMatrix;
uniform float ocean_radius;
uniform float ocean_smoothness;
uniform float ocean_specularPower;
uniform float ocean_alphaModifier;
uniform float ocean_depthModifier;
uniform float ocean_waveBlendingSharpness;
uniform sampler2D normalMap1;
uniform sampler2D normalMap2;

#include "../utils/refraction.glsl";
#include "../utils/triangleWave.glsl";
#include "../utils/textureNoTile.glsl";
#include "../utils/triplanarNormal.glsl";

bool celestialBodyUberShaderSampleOceanLayer(
    vec3 rayDir,
    float maximumDistance,
    out float oceanDistance
) {
    float impactPoint, escapePoint;
    if (!rayIntersectSphere(camera_position, rayDir, object_position, ocean_radius, impactPoint, escapePoint)) {
        return false;
    }

    impactPoint = max(0.0, impactPoint);

    if (impactPoint > maximumDistance + 1.0) {
        return false;
    }

    oceanDistance = impactPoint;
    return true;
}

vec3 celestialBodyUberShaderShadeOcean(vec3 backgroundColor, vec3 rayDir, float oceanDistance, float maximumDistance) {
    float impactPoint, escapePoint;
    if (!rayIntersectSphere(camera_position, rayDir, object_position, ocean_radius, impactPoint, escapePoint)) {
        return backgroundColor;
    }

    impactPoint = max(0.0, impactPoint);
    escapePoint = min(maximumDistance, escapePoint);

    float distanceThroughOcean = max(0.0, escapePoint - impactPoint);

    vec3 samplePoint = camera_position + oceanDistance * rayDir - object_position;
    vec3 planetNormal = normalize(samplePoint);

    vec3 samplePointPlanetSpace = mat3(planetInverseRotationMatrix) * samplePoint;

    vec3 normalSamplePoint1 = triangleWave(samplePointPlanetSpace, 512.0);
    vec3 normalSamplePoint2 = triangleWave(samplePointPlanetSpace, 512.0);

    vec3 normalWave = planetNormal;
    normalWave = triplanarNormal(
        normalSamplePoint1 + vec3(elapsedSeconds, -elapsedSeconds, -elapsedSeconds) * 1.0,
        normalWave,
        normalMap2,
        0.1
    );
    normalWave = triplanarNormal(
        normalSamplePoint2 + vec3(-elapsedSeconds, elapsedSeconds, elapsedSeconds) * 1.0,
        normalWave,
        normalMap1,
        0.05
    );

    float opticalDepth01 = 1.0 - exp(-distanceThroughOcean * ocean_depthModifier);
    float alpha = exp(-distanceThroughOcean * ocean_alphaModifier);

    vec3 deepColor = vec3(4.0, 32.0, 72.0) / 255.0;
    vec3 shallowColor = vec3(32.0, 193.0, 180.0) / 255.0;
    vec3 oceanColor = mix(shallowColor, deepColor, opticalDepth01);

    vec3 ambient = mix(oceanColor, backgroundColor, alpha);

    if (impactPoint > 0.0) {
        vec3 reflectedSkyColor = vec3(0.6, 0.8, 0.95);

        float nAir = 1.0;
        float nWater = 1.33;
        float eta = nAir / nWater;
        vec3 incidentRay = rayDir;
        vec3 refractedRay = refract(incidentRay, normalWave, eta);

        float cosThetaI = dot(-incidentRay, normalWave);
        float cosThetaT = dot(refractedRay, -normalWave);

        float amountReflected = fractionReflected(cosThetaI, cosThetaT, nAir, nWater);

        ambient = mix(ambient, reflectedSkyColor, amountReflected);
    }

    float foamSize = 10.0;
    float foamFactor = saturate((foamSize - distanceThroughOcean) / foamSize);
    foamFactor = smoothstep(0.01, 1.0, foamFactor);

    float cameraDistanceToSurface = length(camera_position - samplePoint - object_position);
    foamFactor *= 1.0 - smoothstep(8e3, 20e3, cameraDistanceToSurface);

    vec3 foamColor = vec3(0.8);
    ambient = mix(ambient, foamColor, foamFactor);

    vec3 finalColor = vec3(0.0);
    for (int i = 0; i < nbStars; i++) {
        vec3 sunDir = star_directions[i];
        float directLightVisibility = 1.0;

#if defined(HAS_RINGS)
        directLightVisibility *= celestialBodyUberShaderRingShadowAtPoint(object_position + samplePoint, sunDir);
#endif

        float ndl = max(dot(planetNormal, sunDir), 0.0);
        finalColor += ambient * ndl * star_colors[i] * directLightVisibility;

        if (length(camera_position - object_position) > ocean_radius) {
            finalColor += computeSpecularHighlight(
                sunDir,
                rayDir,
                normalWave,
                ocean_smoothness,
                ocean_specularPower
            ) * star_colors[i] * directLightVisibility;
        }
    }

    return finalColor;
}
