precision lowp float;

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
uniform float planetRadius; // planet radius

uniform float ringStart; // ring start
uniform float ringEnd; // ring end
uniform float ringFrequency; // ring frequency
uniform float ringOpacity; // ring opacity

uniform vec4 planetRotationQuaternion;

#pragma glslify: completeNoise = require(./utils/noise.glsl)

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, projection=projection, view=view)

#pragma glslify: rayIntersectSphere = require(./utils/rayIntersectSphere.glsl)

bool rayIntersectPlane(vec3 rayOrigin, vec3 rayDir, vec3 planetPosition, vec3 planeNormal, out float t) {
	float denom = dot(rayDir, planeNormal);
	if(abs(denom) <= 0.001) return false; // ray is parallel to the plane
	t = dot(planeNormal, planetPosition - rayOrigin) / dot(planeNormal, rayDir);
	return (t > 0.0);
}

#pragma glslify: lerp = require(./utils/vec3Lerp.glsl)

#pragma glslify: applyQuaternion = require(./utils/applyQuaternion.glsl)

float ringDensityAtPoint(vec3 samplePoint) {
	vec3 samplePointPlanetSpace = samplePoint - planetPosition;

	float distanceToPlanet = length(samplePointPlanetSpace);
    float normalizedDistance = distanceToPlanet / planetRadius;

    // out if not intersecting with rings
	if(normalizedDistance < ringStart || normalizedDistance > ringEnd) return 0.0;

    // compute the actual density of the rings at the sample point
	float ringDensity = completeNoise(vec3(normalizedDistance) * ringFrequency, 4, 2.0, 2.0);

    return ringDensity;
}

void main() {
    vec3 screenColor = texture2D(textureSampler, vUV).rgb; // the current screen color

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
    
    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition); // normalized direction of the ray

    vec3 finalColor;

    vec3 planetUpVector = vec3(0.0, 1.0, 0.0);
    planetUpVector = applyQuaternion(planetRotationQuaternion, planetUpVector);

	float impactPoint;
	if(rayIntersectPlane(cameraPosition, rayDir, planetPosition, planetUpVector, impactPoint)) {
		if(impactPoint < maximumDistance) {
            float t0, t1;
            if(rayIntersectSphere(cameraPosition, rayDir, planetPosition, planetRadius, t0, t1) && t0 < impactPoint) {
                finalColor = screenColor;
            } else {
                vec3 samplePoint = cameraPosition + impactPoint * rayDir;
                float ringDensity = ringDensityAtPoint(samplePoint);
                vec3 ringColor = vec3(0.5) * ringDensity;
                ringColor = lerp(ringColor, screenColor, ringOpacity);

                // hypothèse des rayons parallèles
                vec3 rayToSun = normalize(sunPosition - planetPosition);
                float t2, t3;
                if(rayIntersectSphere(samplePoint, rayToSun, planetPosition, planetRadius, t2,t3)) {
                    //si intersection avec la planète, ombre
                    ringColor *= 0.1;
                }

                finalColor = lerp(ringColor, screenColor, ringDensity);
            }
		} else {
			finalColor = screenColor;
		}
	} else {
		finalColor = screenColor;
	}

    gl_FragColor = vec4(finalColor, 1.0); // displaying the final color
}