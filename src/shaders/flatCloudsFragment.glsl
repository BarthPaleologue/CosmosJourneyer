precision lowp float;

in vec2 vUV;// screen coordinates

// uniforms
uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

#define MAX_STARS 5
uniform vec3 starPositions[MAX_STARS];// positions of the stars in world space
uniform int nbStars;// number of stars

#pragma glslify: camera = require(./utils/camera.glsl)

#pragma glslify: object = require(./utils/object.glsl)

uniform vec4 planetInverseRotationQuaternion;

struct Clouds {
    float layerRadius;// atmosphere radius (calculate from planet center)

    float frequency;// cloud frequency
    float detailFrequency;// cloud detail frequency
    float coverage;// cloud power
    float sharpness;

    vec3 color;

    float worleySpeed;// worley noise speed
    float detailSpeed;// detail noise speed

    float specularPower;
    float smoothness;
};
uniform Clouds clouds;

uniform float time;

#pragma glslify: completeWorley = require(./utils/worley.glsl)

#pragma glslify: completeNoise = require(./utils/noise.glsl)

#pragma glslify: saturate = require(./utils/saturate.glsl)

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=camera.inverseProjection, inverseView=camera.inverseView)

#pragma glslify: rayIntersectSphere = require(./utils/rayIntersectSphere.glsl)

#pragma glslify: smoothSharpener = require(./utils/smoothSharpener.glsl)

#pragma glslify: rotateAround = require(./utils/rotateAround.glsl)

#pragma glslify: computeSpecularHighlight = require(./utils/computeSpecularHighlight.glsl)

#pragma glslify: removeAxialTilt = require(./utils/removeAxialTilt.glsl)

float cloudDensityAtPoint(vec3 samplePoint) {
    vec3 rotationAxisPlanetSpace = vec3(0.0, 1.0, 0.0);

    vec3 samplePointRotatedWorley = rotateAround(samplePoint, rotationAxisPlanetSpace, time * clouds.worleySpeed);
    vec3 samplePointRotatedDetail = rotateAround(samplePoint, rotationAxisPlanetSpace, time * clouds.detailSpeed);

    float density = 1.0 - completeWorley(samplePointRotatedWorley * clouds.frequency, 1, 2.0, 2.0);

    density *= completeNoise(samplePointRotatedDetail * clouds.detailFrequency, 5, 2.0, 2.0);

    float cloudThickness = 2.0;//TODO: make this a uniform

    density = saturate(density * cloudThickness);

    density = smoothstep(clouds.coverage, 1.0, density);

    density = smoothSharpener(density, clouds.sharpness);

    return density;
}

float computeCloudCoverage(vec3 rayOrigin, vec3 rayDir, float maximumDistance, out vec3 cloudNormal) {
    float impactPoint, escapePoint;

    if (!(rayIntersectSphere(rayOrigin, rayDir, object.position, clouds.layerRadius, impactPoint, escapePoint))) {
        return 0.0;// if not intersecting with atmosphere, return original color
    }

    // if ray intersect ocean, update maximum distance (the ocean is not it the depth buffer)
    float waterImpact, waterEscape;
    if (rayIntersectSphere(rayOrigin, rayDir, object.position, object.radius, waterImpact, waterEscape)) {
        maximumDistance = min(maximumDistance, waterImpact);
    }

    if (impactPoint > maximumDistance || escapePoint < 0.0) return 0.0;

    vec3 planetSpacePoint1 = normalize(rayOrigin + impactPoint * rayDir - object.position);
    vec3 planetSpacePoint2 = normalize(rayOrigin + escapePoint * rayDir - object.position);

    vec3 samplePoint1 = removeAxialTilt(planetSpacePoint1, object.rotationAxis);
    vec3 samplePoint2 = removeAxialTilt(planetSpacePoint2, object.rotationAxis);

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
        vec3 sunDir = normalize(starPositions[i] - closestPoint);

        float t0, t1;
        if (!rayIntersectSphere(closestPoint, sunDir, object.position, clouds.layerRadius, t0, t1)) continue;

        vec3 samplePoint = normalize(closestPoint + t1 * sunDir - object.position);
        if (dot(samplePoint, sunDir) < 0.0) continue;
        samplePoint = removeAxialTilt(samplePoint, object.rotationAxis);
        float density = cloudDensityAtPoint(samplePoint);
        lightAmount -= density;
    }

    return 0.2 + saturate(lightAmount) / 0.8;
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV);// the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - camera.position) * remap(depth, 0.0, 1.0, camera.near, camera.far);
    float maximumDistance = length(closestPoint);// the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - camera.position);// normalized direction of the ray

    vec4 finalColor = screenColor;
    if (length(closestPoint - object.position) < clouds.layerRadius) finalColor.rgb *= cloudShadows(closestPoint);

    vec3 cloudNormal;
    float cloudDensity = computeCloudCoverage(camera.position, rayDir, maximumDistance, cloudNormal);

    if (cloudDensity > 0.0) {
        float ndl = 0.0;// dimming factor due to light inclination relative to vertex normal in world space
        float specularHighlight = 0.0;
        for (int i = 0; i < nbStars; i++) {
            vec3 sunDir = normalize(starPositions[i] - object.position);

            ndl += max(dot(cloudNormal, sunDir), -0.3) + 0.3;

            if (length(camera.position - object.position) > clouds.layerRadius) {
                // if above cloud coverage then specular highlight
                specularHighlight += computeSpecularHighlight(sunDir, rayDir, cloudNormal, clouds.smoothness, clouds.specularPower);
            }
        }
        ndl = saturate(ndl);

        vec3 ambiant = mix(finalColor.rgb, ndl * clouds.color, cloudDensity);

        finalColor.rgb = ambiant + specularHighlight * cloudDensity;
    }

    gl_FragColor = finalColor;// displaying the final color
}
