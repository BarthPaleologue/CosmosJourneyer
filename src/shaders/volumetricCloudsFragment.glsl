precision lowp float;

#define PI 3.1415926535897932
#define POINTS_FROM_CAMERA 4 // number sample points along camera ray
#define OPTICAL_DEPTH_POINTS 4 // number sample points along light ray

// varying
varying vec2 vUV; // screen coordinates

// uniforms
uniform sampler2D textureSampler; // the original screen texture
uniform sampler2D depthSampler; // the depth map of the camera

uniform vec3 sunPosition; // position of the sun in world space
uniform vec3 cameraPosition; // position of the camera in world space

uniform mat4 projection; // camera's projection matrix
uniform mat4 view; // camera's view matrix

uniform float cameraNear; // camera minZ
uniform float cameraFar; // camera maxZ

uniform vec3 planetPosition; // planet position in world space
uniform float planetRadius; // planet radius for height calculations
uniform float atmosphereRadius; // atmosphere radius (calculate from planet center)

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: saturate = require(./utils/saturate.glsl)

#pragma glslify: completeNoise = require(./utils/noise.glsl)

#pragma glslify: completeWorley = require(./utils/worley.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, projection=projection, view=view)

#pragma glslify: rayIntersectSphere = require(./utils/rayIntersectSphere.glsl)


// based on https://www.youtube.com/watch?v=DxfEbulyFcY by Sebastian Lague
float densityAtPoint(vec3 densitySamplePoint) {
    
	float heightAboveSurface = length(densitySamplePoint - planetPosition) - planetRadius; // actual height above surface
    float height01 = heightAboveSurface / (atmosphereRadius - planetRadius); // normalized height between 0 and 1
    
	vec3 densitySamplePointPlanetSpace = densitySamplePoint - planetPosition;

	vec3 unitSphereCoord = normalize(densitySamplePointPlanetSpace);

	float weatherMap = 1.0 - completeWorley(unitSphereCoord*5.0, 1, 2.0, 2.0);
	
	float minValue = 0.2;
	weatherMap = max(weatherMap - minValue, 0.0);
	weatherMap /= 1.0 - minValue;
    
	weatherMap *= completeNoise(unitSphereCoord*10.0, 5, 2.0, 2.0);
	
	float detailNoise = completeNoise(densitySamplePointPlanetSpace/10000.0, 3, 2.0, 2.0);
	float detailNoise2 = completeNoise(densitySamplePointPlanetSpace/3000.0, 3, 2.0, 2.0);

	//localDensity = weatherMap * detailNoise * detailNoise2;
	
	float SNsample = remap(weatherMap, (weatherMap * 0.625 + detailNoise * 0.25 + detailNoise2 * 0.125)-1.0, 1.0, 0.0, 1.0);

	float roundBottom = saturate(remap(height01, 0.0, 0.07, 0.0, 1.0));
	float roundTop = saturate(remap(height01, weatherMap * 0.2, weatherMap, 1.0, 0.0));
	
	float roundCorrection = roundBottom * roundTop;

	float reduceDensityBottom = weatherMap * saturate(remap(weatherMap, 0.0, 0.15, 0.0, 1.0));
	float softerTransitionTowardTop = saturate(remap(weatherMap, 0.9, 1.0, 1.0, 0.0));

	float densityCorrection = reduceDensityBottom * softerTransitionTowardTop * weatherMap;

	//float WMc = max(wc0, SAT(gc −0.5) * wc1 * 2);

	float localDensity = saturate(remap(SNsample * roundCorrection, 1.0 - 0.5 * 1.0, 1.0, 0.0, 1.0)) * densityCorrection;

	//localDensity *= localDensity;
	//localDensity *= roundBottom * roundTop * reduceDensityBottom * softerTransitionTowardTop;


	//localDensity /= 1000.0;

	//localDensity = pow(localDensity, 2.0);

	//localDensity = 1.0 - exp(-localDensity/1000000.0);

	localDensity = weatherMap / 300000.0;

	// est lié au bug visuel
	//localDensity *= exp(-height01*1000.0);

    return localDensity;
}

float opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength) {

    float stepSize = rayLength / float(OPTICAL_DEPTH_POINTS - 1); // ray length between sample points
    
    vec3 densitySamplePoint = rayOrigin; // that's where we start

    vec3 densitySamplePointPlanetSpace = rayOrigin - planetPosition;

    float accumulatedOpticalDepth = 0.0;

    for(int i = 0 ; i < OPTICAL_DEPTH_POINTS ; ++i) {
        float localDensity = densityAtPoint(densitySamplePoint); // we get the density at the sample point

        accumulatedOpticalDepth += localDensity * stepSize; // linear approximation : density is constant between sample points

        densitySamplePoint += rayDir * stepSize; // we move the sample point
    }

    return accumulatedOpticalDepth;
}

float calculateLight(vec3 rayOrigin, vec3 rayDir, float rayLength, vec3 originalColor) {

    vec3 samplePoint = rayOrigin; // first sampling point coming from camera ray

    vec3 samplePointPlanetSpace = rayOrigin - planetPosition;

    vec3 sunDir = normalize(sunPosition); // direction to the light source
    
    float stepSize = rayLength / float(POINTS_FROM_CAMERA - 1); // the ray length between sample points

    float inScatteredLight = 0.0; // amount of light scattered for each channel

    for (int i = 0 ; i < POINTS_FROM_CAMERA ; ++i) {

        float sunRayLengthInAtm = atmosphereRadius - length(samplePoint - planetPosition); // distance traveled by light through atmosphere from light source
        float viewRayLengthInAtm = stepSize * float(i); // distance traveled by light through atmosphere from sample point to cameraPosition
        
        float sunRayOpticalDepth = opticalDepth(samplePoint, sunDir, sunRayLengthInAtm); // scattered from the sun to the point
        
        float viewRayOpticalDepth = opticalDepth(samplePoint, -rayDir, viewRayLengthInAtm); // scattered from the point to the camera
        
        float transmittance = exp(-(sunRayOpticalDepth + viewRayOpticalDepth)); // exponential scattering with coefficients
        
        float localDensity = densityAtPoint(samplePoint); // density at sample point

        inScatteredLight += localDensity * transmittance * stepSize; // add the resulting amount of light scattered toward the camera
        
        samplePoint += rayDir * stepSize; // move sample point along view ray
    }

	// faudra revoir ça c'est fishy
    inScatteredLight *= 10.0; // multiply by the intensity of the sun

    return inScatteredLight;
}

vec3 scatter(vec3 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
    float impactPoint, escapePoint;
    if (!(rayIntersectSphere(rayOrigin, rayDir, planetPosition, atmosphereRadius, impactPoint, escapePoint))) {
        return originalColor; // if not intersecting with atmosphere, return original color
    }

    impactPoint = max(0.0, impactPoint); // cannot be negative (the ray starts where the camera is in such a case)
    //impactPoint = min(maximumDistance, impactPoint); // cannot be longer than the maximum distance
	escapePoint = min(maximumDistance, escapePoint); // occlusion with other scene objects

    float distanceThroughAtmosphere = max(0.0, escapePoint - impactPoint); // probably doesn't need the max but for the sake of coherence the distance cannot be negative
    
    vec3 firstPointInAtmosphere = rayOrigin + rayDir * impactPoint; // the first atmosphere point to be hit by the ray

    vec3 firstPointPlanetSpace = firstPointInAtmosphere - planetPosition;

    vec3 light = vec3(calculateLight(firstPointInAtmosphere, rayDir, distanceThroughAtmosphere, originalColor)); // calculate scattering
    
	float ndl = -dot(normalize(rayOrigin + rayDir * impactPoint - planetPosition), normalize(rayOrigin + rayDir * impactPoint - sunPosition));

	//ndl = saturate(ndl + 0.2);

	light = max(light * ndl, 0.0);
	//light *= saturate(max(1.0 - pow(1.0 - ndl, 4.0), 0.0));

    return originalColor * (1.0 - light) + light; // blending scattered color with original color
}

vec3 lerp(vec3 vector1, vec3 vector2, float x) {
    return x * vector1 + (1.0 - x) * vector2;
}

void main() {
    vec3 screenColor = texture2D(textureSampler, vUV).rgb; // the current screen color

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
    
    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition); // normalized direction of the ray

    vec3 finalColor = scatter(screenColor, cameraPosition, rayDir, maximumDistance); // the color to be displayed on the screen

    finalColor = lerp(finalColor, screenColor, finalColor.x);

    // exposure
    //finalColor = 1.0 - exp(-1.0 * finalColor);
    //finalColor = vec3(1.0);

    gl_FragColor = vec4(finalColor, 1.0); // displaying the final color
}