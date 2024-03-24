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

precision lowp float;

#define PI 3.1415926535897932
#define POINTS_FROM_CAMERA 10// number sample points along camera ray
#define OPTICAL_DEPTH_POINTS 10// number sample points along light ray

varying vec2 vUV;// screen coordinates

// uniforms
uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

#include "./utils/stars.glsl";

#include "./utils/camera.glsl";

#include "./utils/object.glsl";

uniform float cloudLayerMaxHeight;// atmosphere radius (calculate from planet center)
uniform float cloudLayerMinHeight;

#include "./utils/saturate.glsl";

#include "./utils/noise.glsl";

#include "./utils/smoothSharpener.glsl";

#include "./utils/worley.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/rayIntersectSphere.glsl";

float densityAtPoint(vec3 densitySamplePoint) {
    vec3 samplePoint = densitySamplePoint - object_position;
    vec3 unitSamplePoint = normalize(samplePoint);
    float height = length(samplePoint);
    float height01 = (height - cloudLayerMinHeight) / (cloudLayerMaxHeight - cloudLayerMinHeight);

    float cloudNoise = smoothSharpener(1.0 - completeWorley(unitSamplePoint * 5.0, 1, 2.0, 2.0), 7.0);

    float detailNoise = completeNoise(samplePoint / 20e3, 3, 2.0, 2.0);

    float density = cloudNoise * detailNoise;

    density *= smoothstep(0.1, 0.3, height01);
    //density *= 1.0 - smoothstep(0.7, 0.9, height01);

    //density = saturate(density);

    return density / 30000.0;
}

float HenyeyGreenstein(float g, float costheta) {
    return (1.0 / (4.0 * PI)) * ((1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * costheta, 1.5));
}

const float darknessThreshold = 0.0;
const float lightAbsorptionTowardSun = 0.94;
const float lightAbsorptionThroughClouds = 0.85;

float lightMarch(vec3 position) {
    vec3 sunDir = normalize(star_positions[i] - position);
    float t0, t1;
    rayIntersectSphere(position, sunDir, object_position, cloudLayerMaxHeight, t0, t1);

    float stepSize = t0 / float(OPTICAL_DEPTH_POINTS - 1);
    float totalDensity = 0.0;

    for (int i = 0; i < OPTICAL_DEPTH_POINTS; i++) {
        position += sunDir * stepSize;
        totalDensity += densityAtPoint(position) * stepSize;
    }
    float transmittance = exp(-totalDensity * lightAbsorptionTowardSun);
    return darknessThreshold + transmittance * (1.0 - darknessThreshold);
}

vec3 clouds(vec3 rayOrigin, vec3 rayDir, float distance, vec3 originalColor, vec3 geometryImpact) {
    vec3 samplePoint = rayOrigin;// first sampling point coming from camera ray
    vec3 samplePointPlanetSpace = rayOrigin - object_position;

    float stepSize = distance / float(POINTS_FROM_CAMERA - 1);// the ray length between sample points

    float totalDensity = 0.0;// amount of light scattered for each channel

    float transmittance = 1.0;
    vec3 lightEnergy = vec3(0.0);

    float costheta = dot(rayDir, normalize(star_positions[0] - object_position));
    float phaseCloud = HenyeyGreenstein(0.3, costheta);

    for (int i = 0; i < POINTS_FROM_CAMERA; i++) {

        float localDensity = densityAtPoint(samplePoint);// density at sample point
        float lightTransmittance = lightMarch(samplePoint);

        lightEnergy += localDensity * stepSize * transmittance * lightTransmittance * phaseCloud;
        transmittance *= exp(-localDensity * stepSize * lightAbsorptionThroughClouds);

        totalDensity += localDensity * stepSize;// add the resulting amount of light scattered toward the camera

        samplePoint += rayDir * stepSize;// move sample point along view ray
    }

    /*vec3 sunDir = normalize(stars[0].position - geometryImpact);
    float t0, t1;
    rayIntersectSphere(geometryImpact, sunDir, object_position, cloudLayerMaxHeight, t0, t1);

    stepSize = t1 / float(OPTICAL_DEPTH_POINTS - 1);
    samplePoint = geometryImpact;
    float groundTransmittance = 1.0;
    for(int i = 0; i < OPTICAL_DEPTH_POINTS; i++) {
        float localDensity = densityAtPoint(samplePoint); // density at sample point
        groundTransmittance *= exp(-localDensity * stepSize * lightAbsorptionThroughClouds);

        totalDensity += localDensity * stepSize; // add the resulting amount of light scattered toward the camera

        samplePoint += sunDir * stepSize; // move sample point along view ray
    }*/

    vec3 cloudColor = vec3(0.7) * lightEnergy;
    return originalColor * transmittance + cloudColor;
}

vec3 scatter(vec3 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
    float height = length(rayOrigin - object_position);

    float impactPoint, escapePoint;
    if (!(rayIntersectSphere(rayOrigin, rayDir, object_position, cloudLayerMaxHeight, impactPoint, escapePoint))) {
        return originalColor;// if not intersecting with atmosphere, return original color
    }

    impactPoint = max(0.0, impactPoint);// cannot be negative (the ray starts where the camera is in such a case)
    escapePoint = min(maximumDistance, escapePoint);// occlusion with other scene objects

    float impactPoint2, escapePoint2;
    if (rayIntersectSphere(rayOrigin, rayDir, object_position, cloudLayerMinHeight, impactPoint2, escapePoint2)) {
        escapePoint = min(maximumDistance, impactPoint2);
    }

    /*float temp = impactPoint;
    impactPoint = min(impactPoint, escapePoint);
    escapePoint = max(temp, escapePoint);*/

    float distanceThroughClouds = max(0.0, escapePoint - impactPoint);// probably doesn't need the max but for the sake of coherence the distance cannot be negative

    vec3 firstPointInCloudLayer = rayOrigin + rayDir * impactPoint;// the first atmosphere point to be hit by the ray

    vec3 firstPointPlanetSpace = firstPointInCloudLayer - object_position;

    return clouds(firstPointInCloudLayer, rayDir, distanceThroughClouds, originalColor, rayOrigin + rayDir * maximumDistance);
}

void main() {
    vec3 screenColor = texture2D(textureSampler, vUV).rgb;// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, depth, camera_inverseProjectionView);// the pixel position in world space (near plane)

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position);

    vec3 rayDir = normalize(worldFromUV(vUV, 1.0, camera_inverseProjectionView) - camera_position);// normalized direction of the ray

    vec3 finalColor = scatter(screenColor, camera_position, rayDir, maximumDistance);// the color to be displayed on the screen

    gl_FragColor = vec4(finalColor, 1.0);// displaying the final color
}