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


precision highp float;

#define DISABLE_UNIFORMITY_ANALYSIS

#define PI 3.1415926535897932

varying vec2 vUV;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;
uniform float elapsedSeconds;

#include "./utils/stars.glsl";
#include "./utils/camera.glsl";
#include "./utils/object.glsl";
#include "./utils/worldFromUV.glsl";
#include "./utils/remap.glsl";
#include "./utils/rayIntersectSphere.glsl";

#if defined(HAS_CLOUDS) || defined(HAS_OCEAN)
#include "./utils/saturate.glsl";
#include "./utils/computeSpecularHighlight.glsl";
#endif

#if defined(HAS_RINGS)
#include "./celestialBodyUberShader/rings.glsl";
#endif

#if defined(HAS_OCEAN)
#include "./celestialBodyUberShader/ocean.glsl";
#endif

#if defined(HAS_ATMOSPHERE)
#include "./celestialBodyUberShader/atmosphere.glsl";
#endif

#if defined(HAS_CLOUDS)
#include "./celestialBodyUberShader/clouds.glsl";
#endif


float computeBodyBlockDistance(vec3 viewDir, float sceneDistance) {
    float bodyImpact, bodyEscape;
    if (rayIntersectSphere(camera_position, viewDir, object_position, object_radius, bodyImpact, bodyEscape)) {
        return min(sceneDistance, max(0.0, bodyImpact));
    } else {
        return sceneDistance;
    }
}

vec4 applyBodySurfaceShadows(vec4 screenColor, vec3 viewDir, float bodyBlockDistance) {
    vec4 baseColor = screenColor;

#if defined(HAS_RINGS)
    baseColor = celestialBodyUberShaderApplyRingShadows(baseColor, viewDir, bodyBlockDistance);
#endif

#if defined(HAS_CLOUDS)
    baseColor = celestialBodyUberShaderApplyCloudShadowsToScene(baseColor, viewDir, bodyBlockDistance);
#endif

    return baseColor;
}

vec3 composeBodySurface(
    vec3 baseColor,
    vec3 viewDir,
    float sceneDistance,
    inout float bodyBlockDistance
) {
    vec3 bodyBlockColor = baseColor;

#if defined(HAS_OCEAN)
    float oceanDistance;
    if (celestialBodyUberShaderSampleOceanLayer(viewDir, bodyBlockDistance, oceanDistance)) {
        bodyBlockColor = celestialBodyUberShaderShadeOcean(bodyBlockColor, viewDir, oceanDistance, sceneDistance);
        bodyBlockDistance = oceanDistance;
    }
#endif

#if defined(HAS_CLOUDS)
    bodyBlockColor = celestialBodyUberShaderComposeCloudShells(bodyBlockColor, viewDir, bodyBlockDistance);
#endif

    return bodyBlockColor;
}

vec3 composeAtmosphereAndRings(vec3 bodyBlockColor, vec3 viewDir, float bodyBlockDistance) {
    vec3 composedColor = bodyBlockColor;

#if defined(HAS_RINGS)
    float ringDistance;
    vec3 ringShadeColor;
    float ringTransmittance;
    bool hasRingLayer = celestialBodyUberShaderSampleVisibleRing(
        viewDir,
        bodyBlockDistance,
        ringDistance,
        ringShadeColor,
        ringTransmittance
    );
#endif

#if defined(HAS_ATMOSPHERE)
    float atmosphereEnter;
    float atmosphereExit;
    bool hasAtmosphere = celestialBodyUberShaderAtmosphereInterval(
        viewDir,
        bodyBlockDistance,
        atmosphereEnter,
        atmosphereExit
    );

    if (hasAtmosphere) {
        float atmosphereSplitDistance = bodyBlockDistance;

#if defined(HAS_RINGS)
        if (hasRingLayer) {
            atmosphereSplitDistance = ringDistance;
        }
#endif

        float segmentStart = max(atmosphereSplitDistance, atmosphereEnter);
        float segmentEnd = min(bodyBlockDistance, atmosphereExit);
        if (segmentEnd > segmentStart) {
            composedColor = celestialBodyUberShaderAtmosphereScatterSegment(
                composedColor,
                viewDir,
                segmentStart,
                segmentEnd
            );
        }
    }
#endif

#if defined(HAS_RINGS)
    if (hasRingLayer) {
        composedColor = mix(ringShadeColor, composedColor, ringTransmittance);
    }
#endif

#if defined(HAS_ATMOSPHERE)
    if (hasAtmosphere) {
        float segmentStart = atmosphereEnter;
        float segmentEnd = min(bodyBlockDistance, atmosphereExit);

#if defined(HAS_RINGS)
        if (hasRingLayer) {
            segmentEnd = min(ringDistance, atmosphereExit);
        }
#endif

        if (segmentEnd > segmentStart) {
            composedColor = celestialBodyUberShaderAtmosphereScatterSegment(
                composedColor,
                viewDir,
                segmentStart,
                segmentEnd
            );
        }
    }
#endif

    return composedColor;
}

void main() {
    ivec2 texelCoord = ivec2(gl_FragCoord.xy);
    vec4 screenColor = texelFetch(textureSampler, texelCoord, 0);
    float depth = texelFetch(depthSampler, texelCoord, 0).r;

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);
    vec3 viewDir = normalize(pixelWorldPosition - camera_position);

    float sceneDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);
    float bodyBlockDistance = computeBodyBlockDistance(viewDir, sceneDistance);

    vec4 baseColor = applyBodySurfaceShadows(screenColor, viewDir, bodyBlockDistance);
    vec3 bodyBlockColor = composeBodySurface(
        baseColor.rgb,
        viewDir,
        sceneDistance,
        bodyBlockDistance
    );
    vec3 composedColor = composeAtmosphereAndRings(bodyBlockColor, viewDir, bodyBlockDistance);

    gl_FragColor = vec4(composedColor, 1.0);
}
