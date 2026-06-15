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

#define ATMOSPHERE_POINTS_FROM_CAMERA 12
#define ATMOSPHERE_OPTICAL_DEPTH_POINTS 12

#include "../utils/atmosphere.glsl";

vec3 celestialBodyUberShaderAtmosphereDensityAtPoint(vec3 densitySamplePoint) {
    float heightAboveSurface = length(densitySamplePoint - object_position) - object_radius;

    vec3 density = vec3(exp(-heightAboveSurface / vec2(atmosphere_rayleighHeight, atmosphere_mieHeight)), 0.0);

    float denom = (atmosphere_ozoneHeight - heightAboveSurface) / atmosphere_ozoneFalloff;
    density.z = (1.0 / (denom * denom + 1.0)) * density.x;

    return density;
}

vec3 celestialBodyUberShaderAtmosphereOpticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength) {
    float stepSize = rayLength / (float(ATMOSPHERE_OPTICAL_DEPTH_POINTS) - 1.0);

    vec3 densitySamplePoint = rayOrigin;
    vec3 accumulatedOpticalDepth = vec3(0.0);

    for (int i = 0; i < ATMOSPHERE_OPTICAL_DEPTH_POINTS; i++) {
        vec3 localDensity = celestialBodyUberShaderAtmosphereDensityAtPoint(densitySamplePoint);
        accumulatedOpticalDepth += localDensity * stepSize;
        densitySamplePoint += rayDir * stepSize;
    }

    return accumulatedOpticalDepth;
}

vec3 celestialBodyUberShaderAtmosphereCalculateLight(
    vec3 rayOrigin,
    vec3 starDir,
    vec3 rayDir,
    float rayLength,
    vec3 originalColor
) {
    vec3 samplePoint = rayOrigin;
    float stepSize = rayLength / (float(ATMOSPHERE_POINTS_FROM_CAMERA) - 1.0);

    vec3 inScatteredRayleigh = vec3(0.0);
    vec3 inScatteredMie = vec3(0.0);
    vec3 totalOpticalDepth = vec3(0.0);

    for (int i = 0; i < ATMOSPHERE_POINTS_FROM_CAMERA; i++) {
        float sunRayLengthInAtm = atmosphere_radius - length(samplePoint - object_position);
        float t0, t1;
        if (rayIntersectSphere(samplePoint, starDir, object_position, atmosphere_radius, t0, t1)) {
            sunRayLengthInAtm = t1;
        }

        vec3 sunRayOpticalDepth = celestialBodyUberShaderAtmosphereOpticalDepth(samplePoint, starDir, sunRayLengthInAtm);

        float viewRayLengthInAtm = stepSize * float(i);
        vec3 viewRayOpticalDepth = celestialBodyUberShaderAtmosphereOpticalDepth(samplePoint, -rayDir, viewRayLengthInAtm);

        vec3 transmittance = exp(
            -atmosphere_rayleighCoeffs * (sunRayOpticalDepth.x + viewRayOpticalDepth.x)
            - atmosphere_mieCoeffs * (sunRayOpticalDepth.y + viewRayOpticalDepth.y)
            - atmosphere_ozoneCoeffs * (sunRayOpticalDepth.z + viewRayOpticalDepth.z)
        );

        vec3 localDensity = celestialBodyUberShaderAtmosphereDensityAtPoint(samplePoint);
        totalOpticalDepth += localDensity * stepSize;

        inScatteredRayleigh += localDensity.x * transmittance * stepSize;
        inScatteredMie += localDensity.y * transmittance * stepSize;

        samplePoint += rayDir * stepSize;
    }

    float costheta = dot(rayDir, starDir);
    float costheta2 = costheta * costheta;

    float phaseRayleigh = 3.0 / (16.0 * PI) * (1.0 + costheta2);

    float g = atmosphere_mieAsymmetry;
    float g2 = g * g;
    float phaseMie = (3.0 * (1.0 - g2) / (8.0 * PI * (2.0 + g2))) * (1.0 + costheta2)
        / pow(1.0 + g2 - 2.0 * g * costheta, 1.5);

    inScatteredRayleigh *= phaseRayleigh * atmosphere_rayleighCoeffs;
    inScatteredMie *= phaseMie * atmosphere_mieCoeffs;

    vec3 opacity = exp(
        -(atmosphere_mieCoeffs * totalOpticalDepth.y
            + atmosphere_rayleighCoeffs * totalOpticalDepth.x
            + atmosphere_ozoneCoeffs * totalOpticalDepth.z)
    );

    return (inScatteredRayleigh + inScatteredMie) * atmosphere_sunIntensity + originalColor * opacity;
}

bool celestialBodyUberShaderAtmosphereInterval(
    vec3 viewDir,
    float maximumDistance,
    out float atmosphereEnter,
    out float atmosphereExit
) {
    if (!rayIntersectSphere(camera_position, viewDir, object_position, atmosphere_radius, atmosphereEnter, atmosphereExit)) {
        return false;
    }

    atmosphereEnter = max(0.0, atmosphereEnter);
    atmosphereExit = min(maximumDistance, atmosphereExit);

    return atmosphereExit > atmosphereEnter;
}

vec3 celestialBodyUberShaderAtmosphereScatterSegment(
    vec3 originalColor,
    vec3 rayDir,
    float segmentStart,
    float segmentEnd
) {
    float distanceThroughAtmosphere = max(0.0, segmentEnd - segmentStart);
    if (distanceThroughAtmosphere <= 0.0) {
        return originalColor;
    }

    vec3 firstPointInAtmosphere = camera_position + rayDir * segmentStart;

    vec3 light = vec3(0.0);
    for (int i = 0; i < nbStars; i++) {
        light = max(
            light,
            celestialBodyUberShaderAtmosphereCalculateLight(
                firstPointInAtmosphere,
                star_directions[i],
                rayDir,
                distanceThroughAtmosphere,
                originalColor
            )
        );
    }

    return light;
}
