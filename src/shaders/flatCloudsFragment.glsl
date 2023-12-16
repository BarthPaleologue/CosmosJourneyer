precision lowp float;

/* disable_uniformity_analysis */

varying vec2 vUV;// screen coordinates

// uniforms
uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

#include "./utils/stars.glsl";

#include "./utils/camera.glsl";

#include "./utils/object.glsl";

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

uniform float time;

#include "./utils/saturate.glsl";

#include "./utils/remap.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/rayIntersectSphere.glsl";

#include "./utils/smoothSharpener.glsl";

#include "./utils/rotateAround.glsl";

#include "./utils/computeSpecularHighlight.glsl";

#include "./utils/removeAxialTilt.glsl";

#include "./utils/toUV.glsl";

float cloudDensityAtPoint(vec3 samplePoint) {
    vec3 rotationAxisPlanetSpace = vec3(0.0, 1.0, 0.0);

    vec3 samplePointRotatedWorley = rotateAround(samplePoint, rotationAxisPlanetSpace, time * clouds_worleySpeed);
    vec3 samplePointRotatedDetail = rotateAround(samplePoint, rotationAxisPlanetSpace, time * clouds_detailSpeed);

    float density = 1.0 - texture2D(clouds_lut, toUV(samplePointRotatedWorley)).r;

    density *= texture2D(clouds_lut, toUV(samplePointRotatedDetail)).g;

    float cloudThickness = 2.0;//TODO: make this a uniform

    density = saturate(density * cloudThickness);

    density = smoothstep(clouds_coverage, 1.0, density);

    density = smoothSharpener(density, clouds_sharpness);

    return density;
}

float computeCloudCoverage(vec3 rayOrigin, vec3 rayDir, float maximumDistance, out vec3 cloudNormal) {
    float impactPoint, escapePoint;

    if (!(rayIntersectSphere(rayOrigin, rayDir, object_position, clouds_layerRadius, impactPoint, escapePoint))) {
        return 0.0;// if not intersecting with atmosphere, return original color
    }

    // if ray intersect ocean, update maximum distance (the ocean is not it the depth buffer)
    float waterImpact, waterEscape;
    if (rayIntersectSphere(rayOrigin, rayDir, object_position, object_radius, waterImpact, waterEscape)) {
        maximumDistance = min(maximumDistance, waterImpact);
    }

    if (impactPoint > maximumDistance || escapePoint < 0.0) return 0.0;

    vec3 planetSpacePoint1 = normalize(rayOrigin + impactPoint * rayDir - object_position);
    vec3 planetSpacePoint2 = normalize(rayOrigin + escapePoint * rayDir - object_position);

    vec3 samplePoint1 = removeAxialTilt(planetSpacePoint1, object_rotationAxis);
    vec3 samplePoint2 = removeAxialTilt(planetSpacePoint2, object_rotationAxis);

    float cloudDensity = 0.0;
    float cloudDensity1 = 0.0;
    float cloudDensity2 = 0.0;

    if (impactPoint > 0.0 && impactPoint < maximumDistance) {
        cloudDensity1 += cloudDensityAtPoint(samplePoint1);
        cloudDensity1 *= saturate((maximumDistance - impactPoint) / 10000.0);// fade away when close to surface
        cloudDensity += cloudDensity1;
    }

    if (escapePoint > 0.0 && escapePoint < maximumDistance) {
        cloudDensity2 += cloudDensityAtPoint(samplePoint2);
        cloudDensity2 *= saturate((maximumDistance - escapePoint) / 10000.0);// fade away when close to surface
        cloudDensity += cloudDensity2;
    }

    if (cloudDensity1 > cloudDensity2) cloudNormal = planetSpacePoint1;
    else cloudNormal = planetSpacePoint2;

    return cloudDensity;
}

float cloudShadows(vec3 closestPoint) {
    float lightAmount = 1.0;
    for (int i = 0; i < nbStars; i++) {
        vec3 sunDir = normalize(star_positions[i] - closestPoint);

        float t0, t1;
        if (!rayIntersectSphere(closestPoint, sunDir, object_position, clouds_layerRadius, t0, t1)) continue;

        vec3 samplePoint = normalize(closestPoint + t1 * sunDir - object_position);
        if (dot(samplePoint, sunDir) < 0.0) continue;
        samplePoint = removeAxialTilt(samplePoint, object_rotationAxis);
        float density = cloudDensityAtPoint(samplePoint);
        lightAmount -= density;
    }

    return 0.2 + saturate(lightAmount) / 0.8;
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    float maximumDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);

    vec3 rayDir = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

    vec3 closestPoint = camera_position + rayDir * maximumDistance;

    vec4 finalColor = screenColor;
    if (length(closestPoint - object_position) < clouds_layerRadius) finalColor.rgb *= cloudShadows(closestPoint);

    vec3 cloudNormal;
    float cloudDensity = computeCloudCoverage(camera_position, rayDir, maximumDistance, cloudNormal);

    if (cloudDensity > 0.0) {
        float ndl = 0.0;// dimming factor due to light inclination relative to vertex normal in world space
        float specularHighlight = 0.0;
        for (int i = 0; i < nbStars; i++) {
            vec3 sunDir = normalize(star_positions[i] - object_position);

            ndl += max(dot(cloudNormal, sunDir), -0.3) + 0.3;

            if (length(camera_position - object_position) > clouds_layerRadius) {
                // if above cloud coverage then specular highlight
                specularHighlight += computeSpecularHighlight(sunDir, rayDir, cloudNormal, clouds_smoothness, clouds_specularPower);
            }
        }
        ndl = saturate(ndl);

        vec3 ambiant = mix(finalColor.rgb, ndl * clouds_color, cloudDensity);

        finalColor.rgb = ambiant + specularHighlight * cloudDensity;
    }

    gl_FragColor = finalColor;// displaying the final color
}
