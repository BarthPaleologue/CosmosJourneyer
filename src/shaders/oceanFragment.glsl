precision lowp float;

in vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera
uniform sampler2D normalMap1;
uniform sampler2D normalMap2;

#pragma glslify: camera = require(./utils/camera.glsl)

#define MAX_STARS 5
uniform int nbStars;// number of stars
struct Star {
    vec3 position;
};
uniform Star stars[MAX_STARS];

#pragma glslify: object = require(./utils/object.glsl)

uniform vec4 planetInverseRotationQuaternion;

struct Ocean {
    float radius;
    float smoothness;
    float specularPower;
    float alphaModifier;
    float depthModifier;
    float waveBlendingSharpness;
};
uniform Ocean ocean;

uniform float time;

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=camera.inverseProjection, inverseView=camera.inverseView)

#pragma glslify: rayIntersectSphere = require(./utils/rayIntersectSphere.glsl)

#pragma glslify: triplanarNormal = require(./utils/triplanarNormal.glsl)

#pragma glslify: saturate = require(./utils/saturate.glsl)

#pragma glslify: applyQuaternion = require(./utils/applyQuaternion.glsl)

#pragma glslify: computeSpecularHighlight = require(./utils/computeSpecularHighlight.glsl)

vec4 oceanColor(vec4 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
    float impactPoint, escapePoint;

    float waveAmplitude = 20.0;

    float waveOmega = 1.0/7.0;

    float actualRadius = ocean.radius + waveAmplitude * sin(time * waveOmega);

    if (!(rayIntersectSphere(rayOrigin, rayDir, object.position, actualRadius, impactPoint, escapePoint))) {
        return originalColor;// if not intersecting with atmosphere, return original color
    }

    impactPoint = max(0.0, impactPoint);// cannot be negative (the ray starts where the camera is in such a case)
    escapePoint = min(maximumDistance, escapePoint);// occlusion with other scene objects

    float distanceThroughOcean = max(0.0, escapePoint - impactPoint);// probably doesn't need the max but for the sake of coherence the distance cannot be negative

    vec3 samplePoint = rayOrigin + impactPoint * rayDir - object.position;

    vec3 samplePointPlanetSpace = applyQuaternion(planetInverseRotationQuaternion, samplePoint);

    vec3 unitSamplePoint = normalize(samplePointPlanetSpace);

    vec3 planetNormal = normalize(samplePoint);

    vec3 normalWave = triplanarNormal(samplePointPlanetSpace + vec3(time, time, -time) * 100.0, planetNormal, normalMap2, 0.00015, ocean.waveBlendingSharpness, 1.0);
    normalWave = triplanarNormal(samplePointPlanetSpace + vec3(-time, time, -time) * 100.0, normalWave, normalMap1, 0.0001, ocean.waveBlendingSharpness, 1.0);

    normalWave = triplanarNormal(samplePointPlanetSpace + vec3(time, -time, -time) * 300.0, normalWave, normalMap1, 0.000025, ocean.waveBlendingSharpness, 0.5);
    normalWave = triplanarNormal(samplePointPlanetSpace + vec3(-time, -time, time) * 300.0, normalWave, normalMap2, 0.00002, ocean.waveBlendingSharpness, 0.5);

    normalWave = triplanarNormal(samplePointPlanetSpace + vec3(time, -time, -time) * 500.0, normalWave, normalMap2, 0.000010, ocean.waveBlendingSharpness, 0.5);
    normalWave = triplanarNormal(samplePointPlanetSpace + vec3(-time, -time, time) * 500.0, normalWave, normalMap1, 0.000005, ocean.waveBlendingSharpness, 0.5);

    //normalWave = triplanarNormal(samplePointPlanetSpace + vec3(time, -time, -time) * 500.0, normalWave, normalMap1, 0.000001, ocean.waveBlendingSharpness, 0.2);
    //normalWave = triplanarNormal(samplePointPlanetSpace + vec3(-time, -time, time) * 500.0, normalWave, normalMap2, 0.0000005, ocean.waveBlendingSharpness, 0.2);

    float ndl = 0.0;
    float specularHighlight = 0.0;

    for (int i = 0; i < nbStars; i++) {
        vec3 sunDir = normalize(stars[i].position - samplePoint);

        float ndl1 = max(dot(normalWave, sunDir), 0.0);// dimming factor due to light inclination relative to vertex normal in world space
        float ndl2 = max(dot(planetNormal, sunDir), 0.0);

        ndl += sqrt(ndl1 * ndl2);

        if (length(rayOrigin - object.position) > ocean.radius) {
            // if above cloud coverage then specular highlight
            specularHighlight += computeSpecularHighlight(sunDir, rayDir, normalWave, ocean.smoothness, ocean.specularPower);
        }
    }

    ndl = saturate(ndl);
    specularHighlight = saturate(specularHighlight);

    if (distanceThroughOcean > 0.0) {
        float opticalDepth01 = 1.0 - exp(-distanceThroughOcean * ocean.depthModifier);
        float alpha = exp(-distanceThroughOcean * ocean.alphaModifier);

        //vec3 oceanColor = lerp(vec3(10.0, 100.0, 249.0)/255.0, vec3(15.0,94.0,156.0)/255.0, opticalDepth01);

        vec3 deepColor = vec3(0.0, 22.0, 82.0)/255.0;
        vec3 shallowColor = vec3(32.0, 193.0, 180.0)/255.0;
        vec3 oceanColor = mix(shallowColor, deepColor, opticalDepth01);

        vec3 ambiant = mix(oceanColor, originalColor.rgb, alpha);

        float foamSize = 30.0;
        float foamFactor = saturate((foamSize - distanceThroughOcean) / foamSize);
        vec3 foamColor = vec3(0.8);
        ambiant = mix(ambiant, foamColor, foamFactor);

        vec3 finalColor = ambiant * ndl + specularHighlight;

        return vec4(finalColor, 1.0);
    }

    return originalColor;
}



void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV);// the pixel position in world space (near plane)

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera.position) * remap(depth, 0.0, 1.0, camera.near, camera.far);

    vec3 rayDir = normalize(pixelWorldPosition - camera.position);// normalized direction of the ray

    vec4 finalColor = oceanColor(screenColor, camera.position, rayDir, maximumDistance);

    gl_FragColor = finalColor;// displaying the final color
}