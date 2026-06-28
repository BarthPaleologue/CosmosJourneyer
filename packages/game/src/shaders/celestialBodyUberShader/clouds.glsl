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

uniform float clouds_layerRadius;
uniform float clouds_frequency;
uniform float clouds_detailFrequency;
uniform float clouds_coverage;
uniform float clouds_sharpness;
uniform vec3 clouds_color;
uniform float clouds_worleySpeed;
uniform float clouds_detailSpeed;
uniform float clouds_specularPower;
uniform float clouds_smoothness;
uniform sampler2D clouds_lut;

const float CELESTIAL_BODY_UBER_SHADER_CLOUD_MAX_OPACITY = 0.85;

#include "../utils/rotateAround.glsl";
#include "../utils/removeAxialTilt.glsl";
#include "../utils/toUV.glsl";

float celestialBodyUberShaderSkewCentered(float x, float k) {
    if (x < 0.5) {
        return 0.5 * pow(2.0 * x, k);
    }
    return 1.0 - 0.5 * pow(2.0 * (1.0 - x), k);
}

float celestialBodyUberShaderCloudDensityAtPoint(vec3 samplePoint) {
    vec3 rotationAxisPlanetSpace = vec3(0.0, 1.0, 0.0);

    vec3 samplePointRotatedWorley = rotateAround(samplePoint, rotationAxisPlanetSpace, -elapsedSeconds * clouds_worleySpeed);
    vec3 samplePointRotatedDetail = rotateAround(samplePoint, rotationAxisPlanetSpace, -elapsedSeconds * clouds_detailSpeed);

    vec2 uvWorley = toUV(samplePointRotatedWorley);
    vec2 uvDetail = toUV(samplePointRotatedDetail);

    vec2 dfWorley = fwidth(uvWorley);
    if (dfWorley.x > 0.5) dfWorley.x = 0.0;

    vec2 dfDetail = fwidth(uvDetail);
    if (dfDetail.x > 0.5) dfDetail.x = 0.0;

    float density = textureLod(clouds_lut, uvWorley, log2(max(dfWorley.x, dfWorley.y) * 1024.0)).r;
    density *= textureLod(clouds_lut, uvDetail, log2(max(dfDetail.x, dfDetail.y) * 1024.0)).g;

    density = sqrt(density);

    float clouds_threshold = 1.0 - celestialBodyUberShaderSkewCentered(clouds_coverage, 0.2);
    float range = pow(0.15, clouds_sharpness);
    density = smoothstep(clouds_threshold - range / 2.0, clouds_threshold + range / 2.0, density);

    return density;
}

float celestialBodyUberShaderCloudShadows(vec3 closestPoint) {
    float lightAmount = 1.0;
    for (int i = 0; i < nbStars; i++) {
        vec3 sunDir = star_directions[i];

        float t0, t1;
        if (!rayIntersectSphere(closestPoint, sunDir, object_position, clouds_layerRadius, t0, t1)) continue;

        vec3 samplePoint = normalize(closestPoint + t1 * sunDir - object_position);
        if (dot(samplePoint, sunDir) < 0.0) continue;
        samplePoint = removeAxialTilt(samplePoint, object_rotationAxis);
        float density = celestialBodyUberShaderCloudDensityAtPoint(samplePoint);
        lightAmount -= density;
    }

    return 0.4 + saturate(lightAmount) * 0.6;
}

vec4 celestialBodyUberShaderApplyCloudShadowsToScene(vec4 screenColor, vec3 rayDir, float maximumDistance) {
    vec3 closestPoint = camera_position + rayDir * maximumDistance;
    float t0, t1;
    if (rayIntersectSphere(camera_position, rayDir, object_position, object_radius, t0, t1)) {
        closestPoint = camera_position + rayDir * min(t0, maximumDistance);
    }

    vec4 finalColor = screenColor;
    if (length(closestPoint - object_position) < clouds_layerRadius) {
        finalColor.rgb *= celestialBodyUberShaderCloudShadows(closestPoint);
    }

    return finalColor;
}

bool celestialBodyUberShaderSampleCloudLayer(
    float cloudDistance,
    vec3 rayDir,
    float maximumDistance,
    out vec3 cloudColor,
    out float cloudTransmittance
) {
    cloudColor = vec3(0.0);
    cloudTransmittance = 1.0;

    if (cloudDistance <= 0.0 || cloudDistance >= maximumDistance) {
        return false;
    }

    vec3 planetSpacePoint = normalize(camera_position + cloudDistance * rayDir - object_position);
    vec3 samplePoint = removeAxialTilt(planetSpacePoint, object_rotationAxis);

    float cloudDensity = celestialBodyUberShaderCloudDensityAtPoint(samplePoint);
    cloudDensity *= saturate((maximumDistance - cloudDistance) / 10000.0);
    if (cloudDensity <= 0.0) {
        return false;
    }

    vec3 scenePoint = camera_position + cloudDistance * rayDir;
    float ndl = 0.0;
    float specularHighlight = 0.0;
    for (int i = 0; i < nbStars; i++) {
        vec3 sunDir = star_directions[i];
        float directLightVisibility = 1.0;

#if defined(HAS_RINGS)
        directLightVisibility *= celestialBodyUberShaderRingShadowAtPoint(scenePoint, sunDir);
#endif

        ndl += (max(dot(planetSpacePoint, sunDir), -0.3) + 0.3) * directLightVisibility;

        if (distance(camera_position, object_position) > clouds_layerRadius) {
            specularHighlight += computeSpecularHighlight(
                sunDir,
                rayDir,
                planetSpacePoint,
                clouds_smoothness,
                clouds_specularPower
            ) * directLightVisibility;
        }
    }
    ndl = saturate(ndl);

    cloudColor = ndl * clouds_color + specularHighlight;
    cloudTransmittance = 1.0 - saturate(cloudDensity) * CELESTIAL_BODY_UBER_SHADER_CLOUD_MAX_OPACITY;

    return true;
}

vec3 celestialBodyUberShaderComposeCloudShells(vec3 baseColor, vec3 rayDir, float maximumDistance) {
    float impactPoint, escapePoint;
    if (!rayIntersectSphere(camera_position, rayDir, object_position, clouds_layerRadius, impactPoint, escapePoint)) {
        return baseColor;
    }

    vec3 finalColor = baseColor;
    vec3 cloudColor;
    float cloudTransmittance;

    if (celestialBodyUberShaderSampleCloudLayer(escapePoint, rayDir, maximumDistance, cloudColor, cloudTransmittance)) {
        finalColor = mix(cloudColor, finalColor, cloudTransmittance);
    }

    if (celestialBodyUberShaderSampleCloudLayer(impactPoint, rayDir, maximumDistance, cloudColor, cloudTransmittance)) {
        finalColor = mix(cloudColor, finalColor, cloudTransmittance);
    }

    return finalColor;
}
