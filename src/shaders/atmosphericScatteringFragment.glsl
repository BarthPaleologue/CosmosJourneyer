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

#define PI 3.1415926535897932
#define POINTS_FROM_CAMERA 12// number sample points along camera ray
#define OPTICAL_DEPTH_POINTS 12// number sample points along light ray

varying vec2 vUV;// screen coordinates

// uniforms
uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

#include "./utils/stars.glsl";

#include "./utils/camera.glsl";

#include "./utils/object.glsl";

#include "./utils/atmosphere.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/rayIntersectSphere.glsl";

// based on https://www.youtube.com/watch?v=DxfEbulyFcY by Sebastian Lague
vec3 densityAtPoint(vec3 densitySamplePoint) {
    float heightAboveSurface = max(0.0, length(densitySamplePoint - object_position) - object_radius);// actual height above surface

    // rayleigh and mie
    vec3 density = vec3(exp(-heightAboveSurface / vec2(atmosphere_rayleighHeight, atmosphere_mieHeight)), 0.0);

    // then, the ozone absorption
    float denom = (atmosphere_ozoneHeight - heightAboveSurface) / atmosphere_ozoneFalloff;
    density.z = (1.0 / (denom * denom + 1.0)) * density.x;

    return density;
}

vec3 opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength) {

    float stepSize = rayLength / float(OPTICAL_DEPTH_POINTS);// ray length between sample points

    vec3 densitySamplePoint = rayOrigin;// that's where we start
    vec3 accumulatedOpticalDepth = vec3(0.0);

    for (int i = 0; i < OPTICAL_DEPTH_POINTS; i++) {
        vec3 localDensity = densityAtPoint(densitySamplePoint);// we get the density at the sample point

        accumulatedOpticalDepth += localDensity * stepSize;// linear approximation : density is constant between sample points

        densitySamplePoint += rayDir * stepSize;// we move the sample point
    }

    return accumulatedOpticalDepth;
}

vec3 calculateLight(vec3 rayOrigin, vec3 starPosition, vec3 rayDir, float rayLength, vec3 originalColor) {

    vec3 samplePoint = rayOrigin;// first sampling point coming from camera ray

    vec3 starDir = normalize(starPosition - object_position);// direction to the light source

    float stepSize = rayLength / float(POINTS_FROM_CAMERA);// the ray length between sample points

    vec3 inScatteredRayleigh = vec3(0.0);
    vec3 inScatteredMie = vec3(0.0);

    vec3 totalOpticalDepth = vec3(0.0);

    for (int i = 0; i < POINTS_FROM_CAMERA; i++) {
        float sunRayLengthInAtm = atmosphere_radius - length(samplePoint - object_position); // distance traveled by light through atmosphere from light source
        float t0, t1;
        if (rayIntersectSphere(samplePoint, starDir, object_position, atmosphere_radius, t0, t1)) {
            sunRayLengthInAtm = t1;
        }

        vec3 sunRayOpticalDepth = opticalDepth(samplePoint, starDir, sunRayLengthInAtm);// scattered from the sun to the point

        float viewRayLengthInAtm = stepSize * float(i);// distance traveled by light through atmosphere from sample point to cameraPosition
        vec3 viewRayOpticalDepth = opticalDepth(samplePoint, -rayDir, viewRayLengthInAtm);// scattered from the point to the camera

        // Now we need to calculate the transmittance
        // this is essentially how much light reaches the current sample point due to scattering
        vec3 transmittance = exp(-atmosphere_rayleighCoeffs * (sunRayOpticalDepth.x + viewRayOpticalDepth.x) - atmosphere_mieCoeffs * (sunRayOpticalDepth.y + viewRayOpticalDepth.y) - atmosphere_ozoneCoeffs * (sunRayOpticalDepth.z + viewRayOpticalDepth.z));

        vec3 localDensity = densityAtPoint(samplePoint);// density at sample point
        totalOpticalDepth += localDensity * stepSize;

        inScatteredRayleigh += localDensity.x * transmittance * stepSize;// add the resulting amount of light scattered toward the camera
        inScatteredMie += localDensity.y * transmittance * stepSize;

        samplePoint += rayDir * stepSize;// move sample point along view ray
    }

    float costheta = dot(rayDir, starDir);
    float costheta2 = costheta * costheta;

    // scattering depends on the direction of the light ray and the view ray : it's the rayleigh phase function
    // https://glossary.ametsoc.org/wiki/Rayleigh_phase_function
    float phaseRayleigh = 3.0 / (16.0 * PI) * (1.0 + costheta2);

    vec3 g = atmosphere_mieAsymmetry;
    vec3 g2 = g * g;

    // Cornette-Shanks phase function for Mie scattering
    vec3 phaseMie = (3.0 * (1.0 - g2) / (8.0 * PI * (2.0 + g2))) * (1.0 + costheta2) / pow(1.0 + g2 - 2.0 * g * costheta, vec3(1.5));

    inScatteredRayleigh *= phaseRayleigh * atmosphere_rayleighCoeffs;
    inScatteredMie *= phaseMie * atmosphere_mieCoeffs;

    // calculate how much light can pass through the atmosphere
    vec3 opacity = exp(-(atmosphere_mieCoeffs * totalOpticalDepth.y + atmosphere_rayleighCoeffs * totalOpticalDepth.x + atmosphere_ozoneCoeffs * totalOpticalDepth.z));

    return (inScatteredRayleigh + inScatteredMie) * atmosphere_sunIntensity + originalColor * opacity;
}

vec3 scatter(vec3 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
    float impactPoint, escapePoint;
    if (!(rayIntersectSphere(rayOrigin, rayDir, object_position, atmosphere_radius, impactPoint, escapePoint))) {
        return originalColor;// if not intersecting with atmosphere, return original color
    }

    impactPoint = max(0.0, impactPoint);// cannot be negative (the ray starts where the camera is in such a case)
    escapePoint = min(maximumDistance, escapePoint);// occlusion with other scene objects

    float distanceThroughAtmosphere = max(0.0, escapePoint - impactPoint);// probably doesn't need the max but for the sake of coherence the distance cannot be negative

    vec3 firstPointInAtmosphere = rayOrigin + rayDir * impactPoint;// the first atmosphere point to be hit by the ray

    vec3 light = vec3(0.0);
    for (int i = 0; i < nbStars; i++) {
        light = max(light, calculateLight(firstPointInAtmosphere, star_positions[i], rayDir, distanceThroughAtmosphere, originalColor.rgb));// calculate scattering
    }

    return light;
}


void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, depth, camera_inverseProjectionView);// the pixel position in world space (near plane)

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position);

    vec3 rayDir = normalize(worldFromUV(vUV, 1.0, camera_inverseProjectionView) - camera_position);

    // Cohabitation avec le shader d'océan (un jour je merge)
    float waterImpact, waterEscape;
    if (rayIntersectSphere(camera_position, rayDir, object_position, object_radius, waterImpact, waterEscape)) {
        maximumDistance = min(maximumDistance, waterImpact);
    }

    vec3 finalColor = scatter(screenColor.rgb, camera_position, rayDir, maximumDistance);// the color to be displayed on the screen

    gl_FragColor = vec4(finalColor, 1.0);// displaying the final color
}
