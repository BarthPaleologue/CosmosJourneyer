precision lowp float;

// varying
varying vec2 vUV; // screen coordinates

// uniforms
uniform sampler2D textureSampler; // the original screen texture
uniform sampler2D depthSampler; // the depth map of the camera
uniform sampler2D normalMap;

uniform vec3 cameraPosition; // position of the camera in world space

#define MAX_STARS 5
uniform vec3 starPositions[MAX_STARS]; // positions of the stars in world space
uniform int nbStars; // number of stars

uniform mat4 inverseProjection; // camera's projection matrix
uniform mat4 inverseView; // camera's view matrix

uniform float cameraNear; // camera minZ
uniform float cameraFar; // camera maxZ

uniform vec3 planetPosition; // planet position in world space
uniform float planetRadius; // planet radius
uniform vec4 planetInverseRotationQuaternion;

struct Clouds {
    float layerRadius; // atmosphere radius (calculate from planet center)

    float frequency; // cloud frequency
    float detailFrequency; // cloud detail frequency
    float coverage; // cloud power
    float sharpness;

    vec3 color;

    float worleySpeed; // worley noise speed
    float detailSpeed; // detail noise speed

    float specularPower;
    float smoothness;
};
uniform Clouds clouds;

uniform float time;

#pragma glslify: completeWorley = require(./utils/worley.glsl)

#pragma glslify: completeNoise = require(./utils/noise.glsl)

#pragma glslify: saturate = require(./utils/saturate.glsl)

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=inverseProjection, inverseView=inverseView)

#pragma glslify: rayIntersectSphere = require(./utils/rayIntersectSphere.glsl)

#pragma glslify: triplanarNormal = require(./utils/triplanarNormal.glsl)

#pragma glslify: lerp = require(./utils/vec3Lerp.glsl)

#pragma glslify: smoothSharpener = require(./utils/smoothSharpener.glsl)

#pragma glslify: applyQuaternion = require(./utils/applyQuaternion.glsl)

#pragma glslify: rotateAround = require(./utils/rotateAround.glsl)

#pragma glslify: computeSpecularHighlight = require(./utils/computeSpecularHighlight.glsl)

float cloudDensityAtPoint(vec3 samplePoint) {

    vec3 rotationAxisPlanetSpace = vec3(0.0, 1.0, 0.0);

    vec3 samplePointRotatedWorley = rotateAround(samplePoint, rotationAxisPlanetSpace, time * clouds.worleySpeed);
    vec3 samplePointRotatedDetail = rotateAround(samplePoint, rotationAxisPlanetSpace, time * clouds.detailSpeed);

    float density = 1.0 - completeWorley(samplePointRotatedWorley * clouds.frequency, 1, 2.0, 2.0);

    density *= completeNoise(samplePointRotatedDetail * clouds.detailFrequency, 5, 2.0, 2.0);

    float cloudThickness = 2.0; //TODO: make this a uniform

    density = saturate(density * cloudThickness);

    density = smoothstep(clouds.coverage, 1.0, density);

    density = smoothSharpener(density, clouds.sharpness);

    return density;
}

vec4 computeCloudCoverage(vec4 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
    float impactPoint, escapePoint;

    if (!(rayIntersectSphere(rayOrigin, rayDir, planetPosition, clouds.layerRadius, impactPoint, escapePoint))) {
        return originalColor; // if not intersecting with atmosphere, return original color
    }

    // if ray intersect ocean, update maximum distance (the ocean is not it the depth buffer)
	float waterImpact, waterEscape;
    if(rayIntersectSphere(rayOrigin, rayDir, planetPosition, planetRadius, waterImpact, waterEscape)) {
        maximumDistance = min(maximumDistance, waterImpact);
    }

    if(impactPoint > maximumDistance || escapePoint < 0.0) return originalColor;

    vec3 planetSpacePoint1 = normalize(rayOrigin + impactPoint * rayDir - planetPosition);
    vec3 planetSpacePoint2 = normalize(rayOrigin + escapePoint * rayDir - planetPosition);

    vec3 samplePoint1 = applyQuaternion(planetInverseRotationQuaternion, planetSpacePoint1);
    vec3 samplePoint2 = applyQuaternion(planetInverseRotationQuaternion, planetSpacePoint2);

    float cloudDensity = 0.0;

    if(impactPoint > 0.0 && impactPoint < maximumDistance) {
        float cloudDensity1 = cloudDensityAtPoint(samplePoint1);
        cloudDensity1 *= saturate((maximumDistance - impactPoint) / 10000.0); // fade away when close to surface
        cloudDensity += cloudDensity1;
    }

    if(escapePoint > 0.0 && escapePoint < maximumDistance) {
        float cloudDensity2 = cloudDensityAtPoint(samplePoint2);
        cloudDensity2 *= saturate((maximumDistance - escapePoint) / 10000.0); // fade away when close to surface
        cloudDensity += cloudDensity2;
    }

    float cloudNormalStrength = 1.0; //TODO: make uniform ?

    vec3 normal = vec3(0.0);
    if(impactPoint > 0.0 && impactPoint < maximumDistance) {
        // first cloud is in front of the camera
        vec3 normalRotatedSamplePoint1 = rotateAround(samplePoint1, vec3(0.0, 1.0, 0.0), time * clouds.detailSpeed);
        normal = triplanarNormal(normalRotatedSamplePoint1, planetSpacePoint1, normalMap, 10.0, 0.5, cloudDensity * cloudNormalStrength);
    } else if (escapePoint > 0.0 && escapePoint < maximumDistance) {
        // second cloud in front of the camera
        vec3 normalRotatedSamplePoint2 = rotateAround(samplePoint2, vec3(0.0, 1.0, 0.0), time * clouds.detailSpeed);
        normal = triplanarNormal(normalRotatedSamplePoint2, planetSpacePoint2, normalMap, 10.0, 0.5, cloudDensity * cloudNormalStrength);
    }

    float ndl = 0.0; // dimming factor due to light inclination relative to vertex normal in world space
    float specularHighlight = 0.0;
    for(int i = 0; i < nbStars; i++) {
        vec3 sunDir = normalize(starPositions[i] - planetPosition);

        ndl += max(dot(normal, sunDir), 0.0);

        if(length(rayOrigin - planetPosition) > clouds.layerRadius) {
            // if above cloud coverage then specular highlight
            specularHighlight += computeSpecularHighlight(sunDir, rayDir, normal, clouds.smoothness, clouds.specularPower);
        }
    }
    ndl = saturate(ndl);

	vec3 ambiant = lerp(originalColor.rgb, sqrt(ndl) * clouds.color, 1.0 - cloudDensity);

    return vec4(ambiant + specularHighlight * cloudDensity, 1.0);
}

vec4 shadows(vec4 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
    if(maximumDistance >= cameraFar) return originalColor;
    float impactPoint, escapePoint;
    if(!rayIntersectSphere(rayOrigin, rayDir, planetPosition, clouds.layerRadius, impactPoint, escapePoint)) return originalColor;
    //hit the planet
    float maxDist = maximumDistance;
    if(rayIntersectSphere(rayOrigin, rayDir, planetPosition, planetRadius, impactPoint, escapePoint)) {
        maxDist = min(maxDist, impactPoint);
    }
    vec3 hitPoint = rayOrigin + maxDist * rayDir;
    if(length(hitPoint - planetPosition) > clouds.layerRadius) return originalColor;
    float lightAmount = 0.0;
    for (int i = 0; i < nbStars; i++) {
        vec3 sunDir = normalize(starPositions[i] - hitPoint);
        float t0, t1;
        if (rayIntersectSphere(hitPoint, sunDir, planetPosition, clouds.layerRadius, t0, t1)) {
            vec3 samplePoint = normalize(hitPoint + t1 * sunDir - planetPosition);
            if (dot(samplePoint, sunDir) < 0.0) continue;
            samplePoint = applyQuaternion(planetInverseRotationQuaternion, samplePoint);
            float density = cloudDensityAtPoint(samplePoint);
            lightAmount += 1.0 - density;
        }
    }
    return originalColor * (0.2 + saturate(lightAmount) / 0.8);
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV); // the current screen color

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
    
    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition); // normalized direction of the ray

    vec4 finalColor = shadows(screenColor, cameraPosition, rayDir, maximumDistance);

    finalColor = computeCloudCoverage(finalColor, cameraPosition, rayDir, maximumDistance);

    gl_FragColor = finalColor; // displaying the final color
}
