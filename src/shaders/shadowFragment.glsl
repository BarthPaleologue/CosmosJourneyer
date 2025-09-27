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
float star_radiuses[MAX_STARS];

#include "./utils/camera.glsl";

#include "./utils/object.glsl";

uniform bool shadowUniforms_hasRings;
uniform bool shadowUniforms_hasClouds;
uniform bool shadowUniforms_hasOcean;

#include "./rings/rings.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/lineIntersectSphere.glsl";

#include "./utils/rayIntersectsPlane.glsl";

#include "./rings/ringsPatternLookup.glsl";

float sphereOccultation(vec3 rayDir, float maximumDistance) {
    if(length(camera_position + rayDir * maximumDistance - star_positions[0]) <= star_radiuses[0] + 1.0) {
        // The point is on the surface of the star
        return 1.0;
    }
    vec3 towardLight = normalize(star_positions[0] - (camera_position + rayDir * maximumDistance));
    float t0, t1;
    if (lineIntersectSphere(camera_position + rayDir * maximumDistance, towardLight, object_position, object_radius, t0, t1)) {
        if (t0 > object_radius) {
            // there is occultation
            vec3 closestPointToPlanetCenter = camera_position + rayDir * maximumDistance + towardLight * (t0 + t1) * 0.5;
            float closestDistanceToPlanetCenter = length(closestPointToPlanetCenter - object_position);
            float r01 = remap(closestDistanceToPlanetCenter, 0.0, object_radius, 0.0, 1.0);
            return 0.01 + 0.99 * smoothstep(0.85, 1.0, r01);
        }
    }
    return 1.0;
}

float ringOccultation(vec3 rayDir, float maximumDistance) {
    if (!shadowUniforms_hasRings) {
        return 1.0;
    }

    float accDensity = 0.0;
    for (int i = 0; i < nbStars; i++) {
        vec3 towardLight = normalize(star_positions[i] - (camera_position + rayDir * maximumDistance));
        float t2;
        if (rayIntersectsPlane(camera_position + rayDir * maximumDistance, towardLight, object_position, object_rotationAxis, 0.001, t2)) {
            vec3 shadowSamplePoint = camera_position + rayDir * maximumDistance + t2 * towardLight;
            float nearOccultationFactor = smoothstep(100e3, 150e3, t2); // fade ring shadow when close to the rings
            accDensity += pow(ringPatternAtPoint(shadowSamplePoint).a, 0.5) * nearOccultationFactor;
        }
    }
    return pow(1.0 - accDensity, 4.0) * 0.99 + 0.01;
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, depth, camera_inverseProjectionView);// the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    float maximumDistance = length(pixelWorldPosition - camera_position);

    vec3 rayDir = normalize(worldFromUV(vUV, 1.0, camera_inverseProjectionView) - camera_position);// normalized direction of the ray

    vec4 finalColor = screenColor;

    if (maximumDistance < camera_far) {
        // There is a solid object in front of the camera
        // maybe it is in this planet's shadow
        float sphereShadow = sphereOccultation(rayDir, maximumDistance);

        // maybe it is in the shadow of the rings
        float ringShadow = ringOccultation(rayDir, maximumDistance);

        finalColor.rgb *= min(sphereShadow, ringShadow);
    }

    gl_FragColor = finalColor;// displaying the final color
}