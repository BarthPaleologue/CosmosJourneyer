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

#if defined(HAS_RAYMARCHED_BODY)
#include "./celestialBodyUberShader/raymarchedBody.glsl";
#endif

#if defined(HAS_RINGS)
#include "./celestialBodyUberShader/rings.glsl";
#endif

#if defined(HAS_MATTER_JETS)
#include "./celestialBodyUberShader/matterJets.glsl";
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

// Distance contract: every compositor distance is measured in world units along
// the current camera ray. `sceneDistance` is the depth-buffer hit,
// `centralBodyDistance` is the nearest hit on the body being composited, and
// `splitDistance` is the ring-plane hit that separates far and near volumetrics.
struct RingLayer {
    bool isVisible;
    float rayDistance;
    vec3 shadeColor;
    float transmittance;
};

float computeCentralBodyDistance(vec3 viewDir, float sceneDistance) {
#if defined(HAS_RAYMARCHED_BODY)
    return sceneDistance;
#else
    float bodyImpact, bodyEscape;
    if (rayIntersectSphere(camera_position, viewDir, object_position, object_radius, bodyImpact, bodyEscape)) {
        return min(sceneDistance, max(0.0, bodyImpact));
    } else {
        return sceneDistance;
    }
#endif
}

vec4 applyBodySurfaceShadows(vec4 screenColor, vec3 viewDir, float centralBodyDistance) {
    vec4 baseColor = screenColor;

#if defined(HAS_RINGS)
    baseColor = celestialBodyUberShaderApplyRingShadows(baseColor, viewDir, centralBodyDistance);
#endif

#if defined(HAS_CLOUDS)
    baseColor = celestialBodyUberShaderApplyCloudShadowsToScene(baseColor, viewDir, centralBodyDistance);
#endif

    return baseColor;
}

vec3 applyRaymarchedBodySurfaceShadows(vec3 centralBodyColor, vec3 viewDir, float centralBodyDistance) {
#if defined(HAS_RAYMARCHED_BODY)
    return applyBodySurfaceShadows(vec4(centralBodyColor, 1.0), viewDir, centralBodyDistance).rgb;
#else
    return centralBodyColor;
#endif
}

vec3 composeBodySurface(
    vec3 baseColor,
    vec3 viewDir,
    float sceneDistance,
    inout float centralBodyDistance
) {
    vec3 centralBodyColor = baseColor;

#if defined(HAS_OCEAN)
    float oceanDistance;
    if (celestialBodyUberShaderSampleOceanLayer(viewDir, centralBodyDistance, oceanDistance)) {
        centralBodyColor = celestialBodyUberShaderShadeOcean(centralBodyColor, viewDir, oceanDistance, sceneDistance);
        centralBodyDistance = oceanDistance;
    }
#endif

#if defined(HAS_CLOUDS)
    centralBodyColor = celestialBodyUberShaderComposeCloudShells(centralBodyColor, viewDir, centralBodyDistance);
#endif

    return centralBodyColor;
}

vec3 composeCentralBody(vec3 baseColor, vec3 viewDir, float sceneDistance, inout float centralBodyDistance) {
#if defined(HAS_RAYMARCHED_BODY)
    float raymarchedBodyDistance;
    vec3 raymarchedBodyColor;
    if (sampleRaymarchedBody(viewDir, sceneDistance, raymarchedBodyDistance, raymarchedBodyColor)) {
        centralBodyDistance = raymarchedBodyDistance;
        return raymarchedBodyColor;
    }

    centralBodyDistance = sceneDistance;
    return baseColor;
#else
    return composeBodySurface(baseColor, viewDir, sceneDistance, centralBodyDistance);
#endif
}

RingLayer sampleRingLayer(vec3 viewDir, float centralBodyDistance) {
    RingLayer ringLayer;
    ringLayer.isVisible = false;
    ringLayer.rayDistance = centralBodyDistance;
    ringLayer.shadeColor = vec3(0.0);
    ringLayer.transmittance = 1.0;

#if defined(HAS_RINGS)
    ringLayer.isVisible = celestialBodyUberShaderSampleVisibleRing(
        viewDir,
        centralBodyDistance,
        ringLayer.rayDistance,
        ringLayer.shadeColor,
        ringLayer.transmittance
    );
#endif

    return ringLayer;
}

float computeOuterEnvironmentSplitDistance(RingLayer ringLayer, float centralBodyDistance) {
    float splitDistance = centralBodyDistance;
#if defined(HAS_RINGS)
    if (ringLayer.isVisible) {
        splitDistance = ringLayer.rayDistance;
    }
#endif
    return splitDistance;
}

vec3 composeFarOuterEffects(vec3 baseColor, vec3 viewDir, float splitDistance, float centralBodyDistance) {
    vec3 composedColor = baseColor;

#if defined(HAS_ATMOSPHERE)
    float atmosphereEnter;
    float atmosphereExit;
    bool hasAtmosphere = celestialBodyUberShaderAtmosphereInterval(
        viewDir,
        centralBodyDistance,
        atmosphereEnter,
        atmosphereExit
    );

    if (hasAtmosphere) {
        float segmentStart = max(splitDistance, atmosphereEnter);
        float segmentEnd = min(centralBodyDistance, atmosphereExit);
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

#if defined(HAS_MATTER_JETS)
    composedColor = celestialBodyUberShaderComposeMatterJetsSegment(
        composedColor,
        viewDir,
        splitDistance,
        centralBodyDistance
    );
#endif

    return composedColor;
}

vec3 composeRingLayer(vec3 baseColor, RingLayer ringLayer) {
#if defined(HAS_RINGS)
    if (ringLayer.isVisible) {
        return mix(ringLayer.shadeColor, baseColor, ringLayer.transmittance);
    }
#endif

    return baseColor;
}

vec3 composeNearOuterEffects(vec3 baseColor, vec3 viewDir, float splitDistance, float centralBodyDistance) {
    vec3 composedColor = baseColor;

#if defined(HAS_ATMOSPHERE)
    float atmosphereEnter;
    float atmosphereExit;
    bool hasAtmosphere = celestialBodyUberShaderAtmosphereInterval(
        viewDir,
        centralBodyDistance,
        atmosphereEnter,
        atmosphereExit
    );

    if (hasAtmosphere) {
        float segmentStart = atmosphereEnter;
        float segmentEnd = min(splitDistance, atmosphereExit);

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

#if defined(HAS_MATTER_JETS)
    composedColor = celestialBodyUberShaderComposeMatterJetsSegment(
        composedColor,
        viewDir,
        0.0,
        splitDistance
    );
#endif

    return composedColor;
}

// Per-pixel compositing order: central body, far volumetrics, ring layer, then near volumetrics.
vec3 composeOuterEnvironment(vec3 centralBodyColor, vec3 viewDir, float centralBodyDistance) {
    RingLayer ringLayer = sampleRingLayer(viewDir, centralBodyDistance);
    float splitDistance = computeOuterEnvironmentSplitDistance(ringLayer, centralBodyDistance);

    vec3 composedColor = composeFarOuterEffects(centralBodyColor, viewDir, splitDistance, centralBodyDistance);
    composedColor = composeRingLayer(composedColor, ringLayer);
    return composeNearOuterEffects(composedColor, viewDir, splitDistance, centralBodyDistance);
}

void main() {
    ivec2 texelCoord = ivec2(gl_FragCoord.xy);
    vec4 screenColor = texelFetch(textureSampler, texelCoord, 0);
    float depth = texelFetch(depthSampler, texelCoord, 0).r;

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);
    vec3 viewDir = normalize(pixelWorldPosition - camera_position);

    float sceneDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);
    float centralBodyDistance = computeCentralBodyDistance(viewDir, sceneDistance);

    vec4 baseColor = screenColor;
#if !defined(HAS_RAYMARCHED_BODY)
    baseColor = applyBodySurfaceShadows(baseColor, viewDir, centralBodyDistance);
#endif

    vec3 centralBodyColor = composeCentralBody(
        baseColor.rgb,
        viewDir,
        sceneDistance,
        centralBodyDistance
    );
    centralBodyColor = applyRaymarchedBodySurfaceShadows(centralBodyColor, viewDir, centralBodyDistance);

    vec3 composedColor = composeOuterEnvironment(centralBodyColor, viewDir, centralBodyDistance);

    gl_FragColor = vec4(composedColor, 1.0);
}
