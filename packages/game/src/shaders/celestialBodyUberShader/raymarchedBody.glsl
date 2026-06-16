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

uniform vec3 accent_color;
uniform float average_screen_size;

#define RAYMARCHED_BODY_MARCHING_ITERATIONS 64

#if defined(HAS_MANDELBULB)
#include "./raymarchedBody/mandelbulb.glsl";
#endif

#if defined(HAS_MANDELBOX)
#include "./raymarchedBody/mandelbox.glsl";
#endif

#if defined(HAS_JULIA_SET)
#include "./raymarchedBody/juliaSet.glsl";
#endif

#if defined(HAS_SIERPINSKI_PYRAMID)
#include "./raymarchedBody/sierpinskiPyramid.glsl";
#endif

#if defined(HAS_MENGER_SPONGE)
#include "./raymarchedBody/mengerSponge.glsl";
#endif

#include "../utils/pbr.glsl";

float raymarchedBodyContrast(float value, float contrastOffset, float contrastMidLevel) {
    return clamp((value - contrastMidLevel) * (1.0 + contrastOffset) + contrastMidLevel, 0.0, 1.0);
}

vec3 raymarchedBodyCosineColor(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

vec3 raymarchedBodyPalette(float t) {
    return raymarchedBodyCosineColor(
        t,
        vec3(0.5, 0.5, 0.5),
        vec3(0.5, 0.5, 0.5),
        vec3(0.07, 0.07, 0.07),
        accent_color
    );
}

float raymarchedBodyMap(vec3 p) {
    return raymarchedBodyDistanceData(p).x;
}

vec3 raymarchedBodyNormal(vec3 p) {
    const float delta = 0.0001;
    return normalize(vec3(
        raymarchedBodyMap(vec3(p.x + delta, p.yz)) - raymarchedBodyMap(vec3(p.x - delta, p.yz)),
        raymarchedBodyMap(vec3(p.x, p.y + delta, p.z)) - raymarchedBodyMap(vec3(p.x, p.y - delta, p.z)),
        raymarchedBodyMap(vec3(p.xy, p.z + delta)) - raymarchedBodyMap(vec3(p.xy, p.z - delta))
    ));
}

float raymarchedBodyShadow(vec3 rayOrigin, vec3 rayDir) {
    float t = 0.01;
    float shadow = 1.0;
    for (int iter = 0; iter < 64; iter++) {
        float d = raymarchedBodyMap(rayOrigin + rayDir * t);
        if (d < 0.0001) {
            return 0.5;
        }
        shadow = min(shadow, 32.0 * d / t);
        t += d;
    }
    return 0.5 + 0.5 * shadow;
}

vec2 raymarchedBodyRayMarch(vec3 rayOrigin, vec3 rayDir, float initialDepth, out float steps) {
    float currentDepth = initialDepth;
    float newDistance = initialDepth;
    float stepSizeFactor = 1.3;
    float oldDistance = 0.0;
    float stepSize = 0.0;
    float cerr = 10000.0;
    float closestDepth = 0.0;
    float pixelRadius = 1.0 / average_screen_size;
    float color = 0.0;
    int intersection = 0;

    for (int i = 0; i < RAYMARCHED_BODY_MARCHING_ITERATIONS; i++) {
        steps = float(i);
        oldDistance = newDistance;
        vec2 distanceData = raymarchedBodyDistanceData(rayOrigin + rayDir * currentDepth);
        newDistance = distanceData.x;
        color += distanceData.y;

        if (stepSizeFactor > 1.0 && abs(oldDistance) + abs(newDistance) < stepSize) {
            stepSize -= stepSizeFactor * stepSize;
            stepSizeFactor = 1.0;
            currentDepth += stepSize;
            continue;
        }

        stepSize = stepSizeFactor * newDistance;
        float error = newDistance / currentDepth;

        if (abs(error) < abs(cerr)) {
            closestDepth = currentDepth;
            cerr = error;
        }

        if (abs(error) < pixelRadius) {
            intersection = 1;
            break;
        }

        currentDepth += stepSize;
    }

    if (intersection == 0) {
        closestDepth = -1.0;
    }

    return vec2(closestDepth, color);
}

vec3 shadeRaymarchedBody(vec3 localPoint, vec3 worldPoint, float colorIndex, float steps) {
#if defined(HAS_MANDELBULB) || defined(HAS_JULIA_SET)
    vec3 albedo = raymarchedBodyPalette(colorIndex * 0.01);
#else
    vec3 albedo = accent_color;
#endif

    vec3 normal = raymarchedBodyNormal(localPoint);
    float roughness = 0.4;
    float metallic = 0.2;
    vec3 viewDir = normalize(camera_position - worldPoint);

    vec3 color = vec3(0.0);
    for (int i = 0; i < nbStars; i++) {
        vec3 starDir = star_directions[i];
        float shadow = raymarchedBodyShadow(localPoint, starDir);
        color += calculateLight(albedo, normal, roughness, metallic, starDir, viewDir, star_colors[i]) * shadow;
    }

#if defined(HAS_MANDELBULB) || defined(HAS_JULIA_SET)
    float ao = steps * 0.01;
    ao = 1.0 - ao / (ao + 0.5);
    ao = raymarchedBodyContrast(ao, 0.3, 0.5);
    color *= (0.5 + 0.5 * ao);
#endif

    return smoothstep(0.0, 0.8, color * 2.0) * 2.0;
}

bool sampleRaymarchedBody(
    vec3 viewDir,
    float maximumDistance,
    out float raymarchedBodyDistance,
    out vec3 raymarchedBodyColor
) {
    raymarchedBodyDistance = maximumDistance;
    raymarchedBodyColor = vec3(0.0);

    float impactPoint;
    float escapePoint;
    if (!rayIntersectSphere(camera_position, viewDir, object_position, object_radius * object_scaling_determinant, impactPoint, escapePoint)) {
        return false;
    }

    float inverseScaling = raymarchedBodyInverseScaling();
    vec3 origin = (camera_position - object_position) * inverseScaling;

    float steps;
    vec2 rayInfo = raymarchedBodyRayMarch(origin, viewDir, max(impactPoint, 0.0) * inverseScaling, steps);
    float rayDepth = rayInfo.x;
    if (rayDepth == -1.0) {
        return false;
    }

    vec3 localPoint = origin + rayDepth * viewDir;
    vec3 worldPoint = object_position + localPoint / inverseScaling;
    float worldDistance = length(worldPoint - camera_position);
    if (worldDistance > maximumDistance) {
        return false;
    }

    raymarchedBodyDistance = worldDistance;
    raymarchedBodyColor = shadeRaymarchedBody(localPoint, worldPoint, rayInfo.y, steps);

#if defined(HAS_JULIA_SET)
    float localDistance = length(localPoint);
    raymarchedBodyColor = mix(raymarchedBodyColor, vec3(0.0), smoothstep(2.0, 15.0, localDistance));
#endif

    return true;
}
