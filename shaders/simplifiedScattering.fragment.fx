precision highp float;

#define PI 3.1415926535897932
#define PRIMARY_STEP_COUNT 10
#define LIGHT_STEP_COUNT 10

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform sampler2D depthData;

uniform vec3 sunPosition;

uniform vec3 cameraPosition;
uniform vec3 camDir;

uniform mat4 camTransform;
uniform mat4 projection;
uniform mat4 view;

uniform vec3 planetPosition;
uniform float planetRadius;
uniform float atmosphereRadius;

vec3 getWorldPositionFromScreenPosition() {	
    // taken from https://playground.babylonjs.com/#63NSAD

	vec4 ndc = vec4(
			(vUV.x - 0.5) * 2.0,
			(vUV.y - 0.5) * 2.0,
			texture2D(depthData, vUV).r,
			1.0
		);

    vec4 posVS = inverse(projection) * ndc;
    vec4 posWS = inverse(view) * vec4((posVS.xyz / posVS.w), 1.0);

    return posWS.xyz;
}

bool rayIntersectSphere(vec3 rayStart, vec3 rayDir, vec3 spherePosition, float sphereRadius, out float t0, out float t1) {
    vec3 oc = rayStart - spherePosition;

    float a = 1.0; // rayDir doit être unitaire sinon on s'y retrouve pas
    float b = 2.0 * dot(oc, rayDir);
    float c = dot(oc, oc) - sphereRadius*sphereRadius;
    
    float d = b*b - 4.0*a*c;

    // Also skip single point of contact
    if(d <= 0.0) {
        return false;
    }

    float r0 = (-b - sqrt(d)) / (2.0*a);
    float r1 = (-b + sqrt(d)) / (2.0*a);

    t0 = min(r0, r1);
    t1 = max(r0, r1);

    return (t1 >= 0.0);
}

float densityAtPoint(vec3 densitySamplePoint) {
    float heightAboveSurface = length(densitySamplePoint - planetPosition) - planetRadius;
    float height01 = heightAboveSurface / (atmosphereRadius - planetRadius);
    float localDensity = exp(-height01 * 3.0) * (1.0 - height01);

    return localDensity;
}

float opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength) {
    vec3 densitySamplePoint = rayOrigin;
    float stepSize = rayLength / (float(LIGHT_STEP_COUNT) - 1.0);
    float accumulatedOpticalDepth = 0.0;

    for(int i = 0 ; i < LIGHT_STEP_COUNT ; i++) {
        float localDensity = densityAtPoint(densitySamplePoint);

        accumulatedOpticalDepth += localDensity * stepSize;

        densitySamplePoint += rayDir * stepSize;
    }

    return accumulatedOpticalDepth;
}

float calculateLight(vec3 rayOrigin, vec3 rayDir, float rayLength) {
    vec3 inScatterPoint = rayOrigin;
    vec3 sunDir = normalize(sunPosition - inScatterPoint);

    float stepSize = rayLength / (float(LIGHT_STEP_COUNT) - 1.0);
    float inScatteredLight = 0.0;

    for (int i = 0 ; i < PRIMARY_STEP_COUNT ; i++) {

        float sunRayLength = atmosphereRadius - length(inScatterPoint - planetPosition);
        
        float sunRayOpticalDepth = opticalDepth(inScatterPoint, sunDir, sunRayLength); // scattered from the sun to the point
        float viewRayOpticalDepth = opticalDepth(inScatterPoint, -rayDir, stepSize * float(i));
        float transmittance = exp(-(sunRayOpticalDepth + viewRayOpticalDepth));
        float localDensity = densityAtPoint(inScatterPoint);

        inScatteredLight += localDensity * transmittance * stepSize;
        inScatterPoint += rayDir * stepSize;
    }

    return inScatteredLight;
}

vec3 scatter(vec3 originalColor, vec3 rayOrigin, vec3 rayDir) {
    float impactPoint, escapePoint;
    if (!(rayIntersectSphere(cameraPosition, rayDir, planetPosition, atmosphereRadius, impactPoint, escapePoint))) {
        return originalColor;
    }

    float distanceThroughAtmosphere = escapePoint - impactPoint;

    vec3 pointInAtmosphere = rayOrigin + rayDir * (distanceThroughAtmosphere);

    float light = calculateLight(pointInAtmosphere, rayDir, distanceThroughAtmosphere);

    return originalColor * (1.0 - light) + light;
}

void main() {
    vec4 baseColor = texture2D(textureSampler, vUV);

    vec3 pixelWorldPosition = getWorldPositionFromScreenPosition();

    vec3 cameraDirection = normalize(pixelWorldPosition - cameraPosition);

    vec3 diffuse = texture2D(textureSampler, vUV).rgb;
    vec3 rayDir = normalize(sunPosition - planetPosition);

    vec3 color = scatter(diffuse, cameraPosition, cameraDirection);

    gl_FragColor = vec4(color, 1.0);

}