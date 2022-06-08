precision lowp float;

// varying
varying vec2 vUV; // screen coordinates

// uniforms
uniform sampler2D textureSampler; // the original screen texture
uniform sampler2D depthSampler; // the depth map of the camera
uniform sampler2D normalMap;

uniform vec3 sunPosition; // position of the sun in world space
uniform vec3 cameraPosition; // position of the camera in world space

uniform mat4 projection; // camera's projection matrix
uniform mat4 view; // camera's view matrix

uniform float cameraNear; // camera minZ
uniform float cameraFar; // camera maxZ

uniform vec3 planetPosition; // planet position in world space
uniform float cloudLayerRadius; // atmosphere radius (calculate from planet center)
uniform float planetRadius; // planet radius

uniform float cloudFrequency; // cloud frequency
uniform float cloudDetailFrequency; // cloud detail frequency
uniform float cloudPower; // cloud power
uniform float cloudSharpness;

uniform vec3 cloudColor;

uniform float worleySpeed; // worley noise speed
uniform float detailSpeed; // detail noise speed

uniform float smoothness;
uniform float specularPower;
uniform float alphaModifier;
uniform float depthModifier;

uniform vec4 planetInverseRotationQuaternion;

uniform float time;

#pragma glslify: completeWorley = require(./utils/worley.glsl)

#pragma glslify: completeNoise = require(./utils/noise.glsl)

#pragma glslify: saturate = require(./utils/saturate.glsl)

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, projection=projection, view=view)

#pragma glslify: rayIntersectSphere = require(./utils/rayIntersectSphere.glsl)

#pragma glslify: triplanarNormal = require(./utils/triplanarNormal.glsl)

#pragma glslify: lerp = require(./utils/vec3Lerp.glsl)

float tanh01(float x) {
	return (tanh(x) + 1.0) / 2.0;
}
float tanhSharpener(float x, float s) {
	float sampleValue = (x - 0.5) * s;
	return tanh01(sampleValue);
}

#pragma glslify: applyQuaternion = require(./utils/applyQuaternion.glsl)

vec3 rotateAround(vec3 vector, vec3 axis, float theta) {
    // rotation using https://www.wikiwand.com/en/Rodrigues%27_rotation_formula
    // Please note that unit vector are required, i did not divided by the norms
    return cos(theta) * vector + cross(axis, vector) * sin(theta) + axis * dot(axis, vector) * (1.0 - cos(theta));
}

float cloudDensityAtPoint(vec3 samplePoint) {

    vec3 rotationAxisPlanetSpace = vec3(0.0, 1.0, 0.0);

    vec3 samplePointRotatedWorley = rotateAround(samplePoint, rotationAxisPlanetSpace, time * worleySpeed);
    vec3 samplePointRotatedDetail = rotateAround(samplePoint, rotationAxisPlanetSpace, time * detailSpeed);

    float density = 1.0 - completeWorley(samplePointRotatedWorley * cloudFrequency, 1, 2.0, 2.0);

    density *= completeNoise(samplePointRotatedDetail * cloudDetailFrequency, 5, 2.0, 2.0);

    density = saturate(density * 2.0);

    density = pow(density, cloudPower);

    density = tanhSharpener(density, cloudSharpness);

    return density;
}

vec3 computeCloudCoverage(vec3 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
    float impactPoint, escapePoint;

    if (!(rayIntersectSphere(rayOrigin, rayDir, planetPosition, cloudLayerRadius, impactPoint, escapePoint))) {
        return originalColor; // if not intersecting with atmosphere, return original color
    }

	float waterImpact, waterEscape;
    if(rayIntersectSphere(cameraPosition, rayDir, planetPosition, planetRadius, waterImpact, waterEscape)) {
        maximumDistance = min(maximumDistance, waterImpact);
    }

	bool twoPoints = impactPoint > 0.0 && escapePoint > 0.0 && escapePoint < maximumDistance;

    if(impactPoint < 0.0) {
        impactPoint = escapePoint;
        if(impactPoint > maximumDistance) {
            return originalColor;
        }
    }
    if(impactPoint > maximumDistance) return originalColor;

    vec3 planetSpacePoint1 = normalize(rayOrigin + impactPoint * rayDir - planetPosition);
    vec3 planetSpacePoint2 = normalize(rayOrigin + escapePoint * rayDir - planetPosition);

	vec3 planetNormal1 = planetSpacePoint1;
	vec3 planetNormal2 = planetSpacePoint2;

    vec3 samplePoint1 = applyQuaternion(planetInverseRotationQuaternion, planetSpacePoint1);
    vec3 samplePoint2 = applyQuaternion(planetInverseRotationQuaternion, planetSpacePoint2);

    /// Cloud point 1
    float cloudDensity = cloudDensityAtPoint(samplePoint1);

    /// Cloud point 2
    if(twoPoints) {
        cloudDensity += cloudDensityAtPoint(samplePoint2);
    }

	cloudDensity = saturate(cloudDensity);

	cloudDensity *= saturate((maximumDistance - impactPoint) / 10000.0); // fade away when close to surface

    // rotate sample point accordingly
    vec3 normalRotatedSamplePoint1 = rotateAround(samplePoint1, vec3(0.0, 1.0, 0.0), time * detailSpeed);

    float cloudNormalStrength = 1.5;
	vec3 normal = triplanarNormal(normalRotatedSamplePoint1, planetNormal1, normalMap, 10.0, 0.5, cloudDensity * cloudNormalStrength);

    // TODO: add another normalmap
    //normal = triplanarNormal(normalRotatedSamplePoint, normal, normalMap, 20.0, 0.5, 0.5 * cloudDensity * cloudNormalStrength);

    vec3 sunDir = normalize(sunPosition - planetPosition); // direction to the light source with parallel rays hypothesis

    float ndl = max(dot(normal, sunDir), 0.0); // dimming factor due to light inclination relative to vertex normal in world space

    //TODO : en faire un uniform
    float smoothness = 0.7;
    float specularAngle = acos(dot(normalize(sunDir - rayDir), normal));
    float specularExponent = specularAngle / (1.0 - smoothness);
    float specularHighlight = exp(-specularExponent * specularExponent);

	vec3 ambiant = lerp(originalColor, ndl * cloudColor, 1.0 - cloudDensity);

    return ambiant + specularHighlight * cloudDensity;
}

void main() {
    vec3 screenColor = texture2D(textureSampler, vUV).rgb; // the current screen color

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
    
    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition); // normalized direction of the ray

    vec3 finalColor = computeCloudCoverage(screenColor, cameraPosition, rayDir, maximumDistance);

    gl_FragColor = vec4(finalColor, 1.0); // displaying the final color
}