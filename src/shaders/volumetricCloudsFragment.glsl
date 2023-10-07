precision lowp float;

#define PI 3.1415926535897932
#define POINTS_FROM_CAMERA 10 // number sample points along camera ray
#define OPTICAL_DEPTH_POINTS 10 // number sample points along light ray

in vec2 vUV; // screen coordinates

// uniforms
uniform sampler2D textureSampler; // the original screen texture
uniform sampler2D depthSampler; // the depth map of the camera

#define MAX_STARS 5
uniform vec3 starPositions[MAX_STARS]; // positions of the stars in world space
uniform int nbStars; // number of stars

#pragma glslify: camera = require(./utils/camera.glsl)

uniform vec3 planetPosition; // planet position in world space
uniform float planetRadius; // planet radius for height calculations

uniform float cloudLayerMaxHeight; // atmosphere radius (calculate from planet center)
uniform float cloudLayerMinHeight;

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: saturate = require(./utils/saturate.glsl)

#pragma glslify: completeNoise = require(./utils/noise.glsl)

#pragma glslify: smoothSharpener = require(./utils/smoothSharpener.glsl)

#pragma glslify: completeWorley = require(./utils/worley.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=camera.inverseProjection, inverseView=camera.inverseView)

#pragma glslify: rayIntersectSphere = require(./utils/rayIntersectSphere.glsl)

float densityAtPoint(vec3 densitySamplePoint) {
    vec3 samplePoint = densitySamplePoint - planetPosition;
    vec3 unitSamplePoint = normalize(samplePoint);
    float height = length(samplePoint);
    float height01 = (height - cloudLayerMinHeight) / (cloudLayerMaxHeight - cloudLayerMinHeight);

    float cloudNoise = smoothSharpener(1.0 - completeWorley(unitSamplePoint * 5.0, 1, 2.0, 2.0), 7.0);

    float detailNoise = completeNoise(samplePoint / 20e3, 3, 2.0, 2.0);

    float density = cloudNoise * detailNoise;

    density *= smoothstep(0.1, 0.3, height01);
    //density *= smoothstep(0.9, 0.7, height01);

    //density = saturate(density);

    return density / 30000.0;
}

float HenyeyGreenstein(float g, float costheta) {
    return (1.0 / (4.0 * PI)) * ((1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * costheta, 1.5));
}

const float darknessThreshold = 0.0;
const float lightAbsorptionTowardSun = 0.94;
const float lightAbsorptionThroughClouds = 0.85;

float lightMarch(vec3 position) {
    vec3 sunDir = normalize(starPositions[0] - position);
    float t0, t1;
    rayIntersectSphere(position, sunDir, planetPosition, cloudLayerMaxHeight, t0, t1);

    float stepSize = t0 / float(OPTICAL_DEPTH_POINTS - 1);
    float totalDensity = 0.0;

    for(int i = 0; i < OPTICAL_DEPTH_POINTS; i++) {
        position += sunDir * stepSize;
        totalDensity += densityAtPoint(position) * stepSize;
    }
    float transmittance = exp(-totalDensity * lightAbsorptionTowardSun);
    return darknessThreshold + transmittance * (1.0 - darknessThreshold);
}

vec3 clouds(vec3 rayOrigin, vec3 rayDir, float distance, vec3 originalColor, vec3 geometryImpact) {
    vec3 samplePoint = rayOrigin; // first sampling point coming from camera ray
    vec3 samplePointPlanetSpace = rayOrigin - planetPosition;

    float stepSize = distance / float(POINTS_FROM_CAMERA - 1); // the ray length between sample points

    float totalDensity = 0.0; // amount of light scattered for each channel

    float transmittance = 1.0;
    vec3 lightEnergy = vec3(0.0);

    float costheta = dot(rayDir, normalize(starPositions[0] - planetPosition));
    float phaseCloud = HenyeyGreenstein(0.3, costheta);

    for (int i = 0 ; i < POINTS_FROM_CAMERA ; i++) {

        float localDensity = densityAtPoint(samplePoint); // density at sample point
        float lightTransmittance = lightMarch(samplePoint);

        lightEnergy += localDensity * stepSize * transmittance * lightTransmittance * phaseCloud;
        transmittance *= exp(-localDensity * stepSize * lightAbsorptionThroughClouds);

        totalDensity += localDensity * stepSize; // add the resulting amount of light scattered toward the camera

        samplePoint += rayDir * stepSize; // move sample point along view ray
    }

    /*vec3 sunDir = normalize(starPositions[0] - geometryImpact);
    float t0, t1;
    rayIntersectSphere(geometryImpact, sunDir, planetPosition, cloudLayerMaxHeight, t0, t1);

    stepSize = t1 / float(OPTICAL_DEPTH_POINTS - 1);
    samplePoint = geometryImpact;
    float groundTransmittance = 1.0;
    for(int i = 0; i < OPTICAL_DEPTH_POINTS; i++) {
        float localDensity = densityAtPoint(samplePoint); // density at sample point
        groundTransmittance *= exp(-localDensity * stepSize * lightAbsorptionThroughClouds);

        totalDensity += localDensity * stepSize; // add the resulting amount of light scattered toward the camera

        samplePoint += sunDir * stepSize; // move sample point along view ray
    }*/

    vec3 cloudColor = vec3(0.7) * lightEnergy;
    return originalColor * transmittance + cloudColor;
}

vec3 scatter(vec3 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
    float height = length(rayOrigin - planetPosition);

    float impactPoint, escapePoint;
    if (!(rayIntersectSphere(rayOrigin, rayDir, planetPosition, cloudLayerMaxHeight, impactPoint, escapePoint))) {
        return originalColor; // if not intersecting with atmosphere, return original color
    }

    impactPoint = max(0.0, impactPoint); // cannot be negative (the ray starts where the camera is in such a case)
    escapePoint = min(maximumDistance, escapePoint); // occlusion with other scene objects

    float impactPoint2, escapePoint2;
    if (rayIntersectSphere(rayOrigin, rayDir, planetPosition, cloudLayerMinHeight, impactPoint2, escapePoint2)) {
        escapePoint = min(maximumDistance, impactPoint2);
    }

    /*float temp = impactPoint;
    impactPoint = min(impactPoint, escapePoint);
    escapePoint = max(temp, escapePoint);*/

    float distanceThroughClouds = max(0.0, escapePoint - impactPoint); // probably doesn't need the max but for the sake of coherence the distance cannot be negative
    
    vec3 firstPointInCloudLayer = rayOrigin + rayDir * impactPoint; // the first atmosphere point to be hit by the ray

    vec3 firstPointPlanetSpace = firstPointInCloudLayer - planetPosition;

    return clouds(firstPointInCloudLayer, rayDir, distanceThroughClouds, originalColor, rayOrigin + rayDir * maximumDistance);
}

void main() {
    vec3 screenColor = texture2D(textureSampler, vUV).rgb; // the current screen color

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
    
    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - camera.position) * remap(depth, 0.0, 1.0, camera.near, camera.far);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - camera.position); // normalized direction of the ray

    vec3 finalColor = scatter(screenColor, camera.position, rayDir, maximumDistance); // the color to be displayed on the screen

    gl_FragColor = vec4(finalColor, 1.0); // displaying the final color
}