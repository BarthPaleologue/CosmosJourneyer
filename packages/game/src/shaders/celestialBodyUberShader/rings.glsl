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

uniform bool bodyEmitsLight;

const float rings_f1 = 0.60;
const float rings_f2 = 0.25;
const float rings_f3 = 0.15;
const float rings_g1 = 0.75;
const float rings_g2 = -0.30;
const float rings_g3 = 0.00;
const float rings_w = 0.90;

#include "../utils/remap.glsl";
#include "../utils/sphereShadowCasters.glsl";
#include "../utils/rayIntersectsPlane.glsl";
#include "../rings/rings.glsl";
#include "../rings/ringsPatternLookup.glsl";

float celestialBodyUberShaderRingShadowAtPoint(vec3 scenePoint, vec3 towardLight) {
    float t2;
    if (!rayIntersectsPlane(scenePoint, towardLight, object_position, object_rotationAxis, 0.001, t2) || t2 <= 0.0) {
        return 1.0;
    }

    vec3 shadowSamplePoint = scenePoint + t2 * towardLight;
    float density = pow(ringPatternAtPoint(shadowSamplePoint).a, 0.5);

    return remap(pow(1.0 - density, 4.0), 0.0, 1.0, 0.15, 1.0);
}

float celestialBodyUberShaderHgLobe(float cosA, float g) {
    float g2 = g*g;
    return (1.0 - g2) * inversesqrt(
        (1.0 + g2 - 2.0*g*cosA) * (1.0 + g2 - 2.0*g*cosA) * (1.0 + g2 - 2.0*g*cosA)
    );
}

float celestialBodyUberShaderHgBulkPhase3(float cosA) {
    float p = 0.0;
    p += rings_f1 * celestialBodyUberShaderHgLobe(cosA, rings_g1);
    p += rings_f2 * celestialBodyUberShaderHgLobe(cosA, rings_g2);
    p += rings_f3 * celestialBodyUberShaderHgLobe(cosA, rings_g3);
    return p / (4.0 * PI);
}

float celestialBodyUberShaderTanHalfFromCos(float cosA) {
    float clampedCosA = clamp(cosA, -0.9999, 0.9999);
    return sqrt(max(0.0, (1.0 - clampedCosA) / (1.0 + clampedCosA)));
}

vec3 celestialBodyUberShaderCalculateStarLightingForRings(
    vec3 samplePoint,
    vec3 viewDir,
    vec3 ringAlbedo,
    vec3 starDir,
    vec3 starColor
) {
    float cosA = dot(starDir, -viewDir);

    float softShadowFactor = 1.0;
    float t2, t3;
    for (int i = 0; i < shadowCastingSphereCount; i++) {
        vec4 shadowCastingSphere = shadowCastingSpheres[i];
        vec3 shadowCasterPosition = shadowCastingSphere.xyz;
        float shadowCasterRadius = shadowCastingSphere.w;
        if (rayIntersectSphere(samplePoint, starDir, shadowCasterPosition, shadowCasterRadius, t2, t3)) {
            vec3 cp = samplePoint + starDir * (t2 + t3) * 0.5;
            float r01 = remap(length(cp - shadowCasterPosition), 0.0, shadowCasterRadius, 0.0, 1.0);
            softShadowFactor *= smoothstep(0.98, 1.0, r01);
        }
    }

    float phase = rings_w * celestialBodyUberShaderHgBulkPhase3(cosA);

    float B0 = 1.2;
    float h  = 0.02;
    float tanHalfPhaseAngle = celestialBodyUberShaderTanHalfFromCos(cosA);
    float shadowHidingOpposition = B0 / (1.0 + tanHalfPhaseAngle / h);
    phase *= 1.0 + shadowHidingOpposition;

    phase += 0.3;

    return starColor * ringAlbedo * phase * softShadowFactor;
}

vec4 celestialBodyUberShaderApplyRingShadows(vec4 screenColor, vec3 viewDir, float maximumDistance) {
    vec4 finalColor = screenColor;

    if (maximumDistance < camera_far) {
        float accDensity = 0.0;
        vec3 scenePoint = camera_position + viewDir * maximumDistance;
        bool scenePointIsOnCentralBody = length(scenePoint - object_position) <= object_radius * 1.01;
        if (!bodyEmitsLight || !scenePointIsOnCentralBody) {
            for (int i = 0; i < nbStars; i++) {
                vec3 towardLight = star_directions[i];
                float t2;
                if (rayIntersectsPlane(scenePoint, towardLight, object_position, object_rotationAxis, 0.001, t2)) {
                    vec3 shadowSamplePoint = scenePoint + t2 * towardLight;
                    float nearOccultationFactor = smoothstep(100e3, 150e3, t2);
                    accDensity += pow(ringPatternAtPoint(shadowSamplePoint).a, 0.5) * nearOccultationFactor;
                }
            }
        }

        finalColor.rgb *= remap(pow(1.0 - accDensity, 4.0), 0.0, 1.0, 0.15, 1.0);
    }

    return finalColor;
}

bool celestialBodyUberShaderSampleVisibleRing(
    vec3 viewDir,
    float maximumDistance,
    out float ringDistance,
    out vec3 ringShadeColor,
    out float ringTransmittance
) {
    ringDistance = maximumDistance;
    ringShadeColor = vec3(0.0);
    ringTransmittance = 1.0;

    float impactPoint;
    if (rayIntersectsPlane(camera_position, viewDir, object_position, object_rotationAxis, 0.001, impactPoint)) {
        if (impactPoint >= 0.0 && impactPoint < maximumDistance) {
            float t0, t1;
            if (!rayIntersectSphere(camera_position, viewDir, object_position, object_radius, t0, t1) || t0 > impactPoint) {
                vec3 samplePoint = camera_position + impactPoint * viewDir;
                vec4 pattern = ringPatternAtPoint(samplePoint);

                vec3 ringAlbedo = pattern.rgb;

                float ringOpacity = pattern.a;
                ringOpacity *= smoothstep(rings_fade_out_distance * 2.0, rings_fade_out_distance * 5.0, impactPoint);

                if (ringOpacity <= 0.0) {
                    return false;
                }

                for (int i = 0; i < nbStars; i++) {
                    ringShadeColor += celestialBodyUberShaderCalculateStarLightingForRings(
                        samplePoint,
                        viewDir,
                        ringAlbedo,
                        star_directions[i],
                        star_colors[i]
                    );
                }

                float normalIncidenceExtinction = ringOpacity;
                float opticalDepthAtNormalIncidence = -log(max(1e-4, 1.0 - normalIncidenceExtinction));
                float opticalDepthAlongViewRay = opticalDepthAtNormalIncidence / max(abs(dot(viewDir, object_rotationAxis)), 0.3);
                ringTransmittance = exp(-opticalDepthAlongViewRay);
                ringDistance = impactPoint;

                return true;
            }
        }
    }

    return false;
}
