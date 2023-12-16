precision highp float;

/* disable_uniformity_analysis */

varying vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera
uniform sampler2D normalMap1;
uniform sampler2D normalMap2;

#include "./utils/camera.glsl";

#include "./utils/stars.glsl";

#include "./utils/object.glsl";

uniform vec4 planetInverseRotationQuaternion;

uniform float ocean_radius;
uniform float ocean_smoothness;
uniform float ocean_specularPower;
uniform float ocean_alphaModifier;
uniform float ocean_depthModifier;
uniform float ocean_waveBlendingSharpness;

uniform float time;

#include "./utils/remap.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/rayIntersectSphere.glsl";

#include "./utils/triplanarNormal.glsl";

#include "./utils/saturate.glsl";

#include "./utils/applyQuaternion.glsl";

#include "./utils/computeSpecularHighlight.glsl";


void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);

    vec3 rayDir = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

    vec4 finalColor = screenColor;

    float waveAmplitude = 20.0;
    float waveOmega = 1.0/7.0;
    float actualRadius = ocean_radius + waveAmplitude * sin(time * waveOmega);

    float impactPoint, escapePoint;
    if (rayIntersectSphere(camera_position, rayDir, object_position, actualRadius, impactPoint, escapePoint) && impactPoint < maximumDistance) {
        impactPoint = max(0.0, impactPoint);// cannot be negative (the ray starts where the camera is in such a case)
        escapePoint = min(maximumDistance, escapePoint);// occlusion with other scene objects

        float distanceThroughOcean = max(0.0, escapePoint - impactPoint);// probably doesn't need the max but for the sake of coherence the distance cannot be negative

        vec3 samplePoint = camera_position + impactPoint * rayDir - object_position;

        vec3 samplePointPlanetSpace = applyQuaternion(planetInverseRotationQuaternion, samplePoint);
        vec3 unitSamplePoint = normalize(samplePointPlanetSpace);
        vec3 planetNormal = normalize(samplePoint);

        vec3 normalWave = triplanarNormal(samplePointPlanetSpace + vec3(time, time, -time) * 100.0, planetNormal, normalMap2, 0.00015, ocean_waveBlendingSharpness, 1.0);
        normalWave = triplanarNormal(samplePointPlanetSpace + vec3(-time, time, -time) * 100.0, normalWave, normalMap1, 0.0001, ocean_waveBlendingSharpness, 1.0);

        normalWave = triplanarNormal(samplePointPlanetSpace + vec3(time, -time, -time) * 300.0, normalWave, normalMap1, 0.000025, ocean_waveBlendingSharpness, 0.5);
        normalWave = triplanarNormal(samplePointPlanetSpace + vec3(-time, -time, time) * 300.0, normalWave, normalMap2, 0.00002, ocean_waveBlendingSharpness, 0.5);

        normalWave = triplanarNormal(samplePointPlanetSpace + vec3(time, -time, -time) * 500.0, normalWave, normalMap2, 0.000010, ocean_waveBlendingSharpness, 0.5);
        normalWave = triplanarNormal(samplePointPlanetSpace + vec3(-time, -time, time) * 500.0, normalWave, normalMap1, 0.000005, ocean_waveBlendingSharpness, 0.5);

        float opticalDepth01 = 1.0 - exp(-distanceThroughOcean * ocean_depthModifier);
        float alpha = exp(-distanceThroughOcean * ocean_alphaModifier);

        vec3 deepColor = vec3(0.0, 22.0, 82.0)/255.0;
        vec3 shallowColor = vec3(32.0, 193.0, 180.0)/255.0;
        vec3 oceanColor = mix(shallowColor, deepColor, opticalDepth01) * star_colors[0];

        vec3 ambiant = mix(oceanColor, screenColor.rgb, alpha);

        float foamSize = 30.0;
        float foamFactor = saturate((foamSize - distanceThroughOcean) / foamSize);
        vec3 foamColor = vec3(0.8);
        ambiant = mix(ambiant, foamColor, foamFactor);

        finalColor.rgb = vec3(0.0);
        for (int i = 0; i < nbStars; i++) {
            vec3 sunDir = normalize(star_positions[i] - samplePoint);

            float ndl = max(dot(planetNormal, sunDir), 0.0);
            finalColor.rgb += ambiant * ndl;

            if (length(camera_position - object_position) > ocean_radius) {
                // if above ocean surface then specular highlight
                finalColor.rgb += computeSpecularHighlight(sunDir, rayDir, normalWave, ocean_smoothness, ocean_specularPower) * star_colors[i];
            }
        }
    }

    gl_FragColor = finalColor;
}