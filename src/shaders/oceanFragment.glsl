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
uniform sampler2D normalMap1;
uniform sampler2D normalMap2;

#include "./utils/camera.glsl";

#include "./utils/stars.glsl";

#include "./utils/object.glsl";

uniform mat4 planetInverseRotationMatrix;

uniform float ocean_radius;
uniform float ocean_smoothness;
uniform float ocean_specularPower;
uniform float ocean_alphaModifier;
uniform float ocean_depthModifier;
uniform float ocean_waveBlendingSharpness;

uniform float time;

#include "./utils/worldFromUV.glsl";

#include "./utils/rayIntersectSphere.glsl";

#include "./utils/textureNoTile.glsl";

#include "./utils/triplanarNormal.glsl";

#include "./utils/saturate.glsl";

#include "./utils/applyQuaternion.glsl";

#include "./utils/computeSpecularHighlight.glsl";

#include "./utils/refraction.glsl";

#include "./utils/triangleWave.glsl";

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, depth, camera_inverseProjectionView);// the pixel position in world space (near plane)

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position);

    vec3 rayDir = normalize(worldFromUV(vUV, 1.0, camera_inverseProjectionView) - camera_position);

    vec4 finalColor = screenColor;

    float actualRadius = ocean_radius;

    float impactPoint, escapePoint;
    if (rayIntersectSphere(camera_position, rayDir, object_position, actualRadius, impactPoint, escapePoint) && impactPoint < maximumDistance) {
        impactPoint = max(0.0, impactPoint);// cannot be negative (the ray starts where the camera is in such a case)
        escapePoint = min(maximumDistance, escapePoint);// occlusion with other scene objects

        float distanceThroughOcean = max(0.0, escapePoint - impactPoint);// probably doesn't need the max but for the sake of coherence the distance cannot be negative

        vec3 samplePoint = camera_position + impactPoint * rayDir - object_position;

        vec3 planetNormal = normalize(samplePoint);

        vec3 samplePointPlanetSpace = mat3(planetInverseRotationMatrix) * samplePoint;

        vec3 normalSamplePoint1 = triangleWave(samplePointPlanetSpace, 512.0);
        vec3 normalSamplePoint2 = triangleWave(samplePointPlanetSpace, 512.0);

        vec3 normalWave = planetNormal;
        normalWave = triplanarNormal(normalSamplePoint1 + vec3(time, -time, -time) * 1.0, normalWave, normalMap2, 0.1);
        normalWave = triplanarNormal(normalSamplePoint2 + vec3(-time, time, time) * 1.0, normalWave, normalMap1, 0.05);

        float opticalDepth01 = 1.0 - exp(-distanceThroughOcean * ocean_depthModifier);
        float alpha = exp(-distanceThroughOcean * ocean_alphaModifier);

        vec3 deepColor = vec3(0.0, 22.0, 82.0)/255.0;
        vec3 shallowColor = vec3(32.0, 193.0, 180.0)/255.0;
        vec3 oceanColor = mix(shallowColor, deepColor, opticalDepth01);

        vec3 ambiant = mix(oceanColor, screenColor.rgb, alpha);

        // if the camera is not inside the ocean
        if (impactPoint > 0.0) {
            // color of the sky
            vec3 reflectedSkyColor = vec3(0.6, 0.8, 0.95);

            // refraction
            float nAir = 1.0;
            float nWater = 1.33;
            float eta = nAir / nWater;
            vec3 incidentRay = rayDir;
            vec3 refractedRay = refract(incidentRay, normalWave, eta);

            float cosThetaI = dot(-incidentRay, normalWave);
            float cosThetaT = dot(refractedRay, -normalWave);

            float amountReflected = fractionReflected(cosThetaI, cosThetaT, nAir, nWater);

            ambiant = mix(ambiant, reflectedSkyColor, amountReflected);
        }

        float foamSize = 10.0;
        float foamFactor = saturate((foamSize - distanceThroughOcean) / foamSize);
        foamFactor = smoothstep(0.01, 1.0, foamFactor);
        vec3 foamColor = vec3(0.8);
        ambiant = mix(ambiant, foamColor, foamFactor);

        finalColor.rgb = vec3(0.0);
        for (int i = 0; i < nbStars; i++) {
            vec3 sunDir = normalize(star_positions[i] - samplePoint);

            float ndl = max(dot(planetNormal, sunDir), 0.0);
            finalColor.rgb += ambiant * ndl * star_colors[i];

            if (length(camera_position - object_position) > ocean_radius) {
                // if above ocean surface then specular highlight
                finalColor.rgb += computeSpecularHighlight(sunDir, rayDir, normalWave, ocean_smoothness, ocean_specularPower) * star_colors[i];
            }
        }
    }

    gl_FragColor = finalColor;
}