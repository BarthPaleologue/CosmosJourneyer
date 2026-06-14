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

#define DISABLE_UNIFORMITY_ANALYSIS

varying vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

#include "./utils/stars.glsl";

#include "./utils/camera.glsl";

#include "./utils/remap.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/rayIntersectSphere.glsl";

#include "./utils/sphereShadowCasters.glsl";

float sphereOccultation(vec3 rayOrigin, vec3 rayToLight, vec3 spherePosition, float sphereRadius) {
    float t0, t1;
    if (rayIntersectSphere(rayOrigin, rayToLight, spherePosition, sphereRadius, t0, t1) && t0 > sphereRadius) {
        vec3 closestPointToPlanetCenter = rayOrigin + rayToLight * (t0 + t1) * 0.5;
        float closestDistanceToPlanetCenter = length(closestPointToPlanetCenter - spherePosition);
        float r01 = remap(closestDistanceToPlanetCenter, 0.0, sphereRadius, 0.0, 1.0);
        return 0.01 + 0.99 * smoothstep(0.85, 1.0, r01);
    }
    return 1.0;
}


void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    float maximumDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);

    vec3 rayDir = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

    vec4 finalColor = screenColor;

    if (maximumDistance < camera_far && nbStars > 0) {
        // There is a solid object in front of the camera
        float totalIntensity = 0.0;
        vec3 scenePoint = camera_position + rayDir * maximumDistance;
        for(int j = 0; j < nbStars; j++) {
            vec3 starDirection = star_directions[j];
            float shadowMultiplier = 1.0;
            for (int i = 0; i < shadowCastingSphereCount; i++) {
                vec4 shadowCastingSphere = shadowCastingSpheres[i];
                vec3 shadowCasterPosition = shadowCastingSphere.xyz;
                float shadowCasterRadius = shadowCastingSphere.w;

                shadowMultiplier = min(shadowMultiplier, sphereOccultation(scenePoint, starDirection, shadowCasterPosition, shadowCasterRadius));
            }
            totalIntensity += shadowMultiplier;
        }
        totalIntensity /= float(nbStars);
        finalColor.rgb *= totalIntensity;
    }

    gl_FragColor = finalColor;
}