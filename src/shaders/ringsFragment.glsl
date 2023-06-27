precision lowp float;

varying vec2 vUV; // screen coordinates

uniform sampler2D textureSampler; // the original screen texture
uniform sampler2D depthSampler; // the depth map of the camera

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

uniform float ringStart; // ring start
uniform float ringEnd; // ring end
uniform float ringFrequency; // ring frequency
uniform float ringOpacity; // ring opacity
uniform vec3 ringColor; // ring color

uniform vec3 planetRotationAxis;

#pragma glslify: completeNoise = require(./utils/noise.glsl)

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=inverseProjection, inverseView=inverseView)

#pragma glslify: rayIntersectSphere = require(./utils/rayIntersectSphere.glsl)


bool rayIntersectPlane(vec3 rayOrigin, vec3 rayDir, vec3 planetPosition, vec3 planeNormal, float tolerance, out float t) {
	float denom = dot(rayDir, planeNormal);
	if(abs(denom) <= tolerance) return false; // ray is parallel to the plane
	t = dot(planeNormal, planetPosition - rayOrigin) / denom;
	return t > 0.0;
}

#pragma glslify: lerp = require(./utils/vec3Lerp.glsl)

float ringDensityAtPoint(vec3 samplePoint) {
	vec3 samplePointPlanetSpace = samplePoint - planetPosition;

	float distanceToPlanet = length(samplePointPlanetSpace);
    float normalizedDistance = distanceToPlanet / planetRadius;

    // out if not intersecting with rings and interpolation area
	if(normalizedDistance < ringStart || normalizedDistance > ringEnd) return 0.0;

    // compute the actual density of the rings at the sample point
    float macroRingDensity = completeNoise(vec3(normalizedDistance) * ringFrequency / 10.0, 1, 2.0, 2.0);
	float ringDensity = completeNoise(vec3(normalizedDistance) * ringFrequency, 5, 2.0, 2.0);
    ringDensity = mix(ringDensity, macroRingDensity, 0.5);
    ringDensity *= smoothstep(ringStart, ringStart + 0.03, normalizedDistance);
    ringDensity *= smoothstep(ringEnd, ringEnd - 0.03, normalizedDistance);

    ringDensity *= ringDensity;

    return ringDensity;
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV); // the current screen color

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
    
    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition); // normalized direction of the ray

    vec4 finalColor = screenColor;

	float impactPoint;
	if(rayIntersectPlane(cameraPosition, rayDir, planetPosition, planetRotationAxis, 0.001, impactPoint)) {
        // if the ray intersect the ring plane
		if(impactPoint < maximumDistance) {
            // if the ray intersects the ring before any other object
            float t0, t1;
            if(rayIntersectSphere(cameraPosition, rayDir, planetPosition, planetRadius, t0, t1) && t0 < impactPoint) {
                // if the ray is impacting the ocean of a telluric planet before the ring plane (it is occulted)
                finalColor = screenColor;
            } else {
                // if the ray is impacting a solid object after the ring plane
                vec3 samplePoint = cameraPosition + impactPoint * rayDir;
                float ringDensity = ringDensityAtPoint(samplePoint) * ringOpacity;

                vec3 ringShadeColor = ringColor;

                // hypothèse des rayons parallèles
                int nbLightSources = nbStars;
                for(int i = 0; i < nbStars; i++) {
                    vec3 rayToSun = normalize(starPositions[i] - planetPosition);
                    float t2, t3;
                    if (rayIntersectSphere(samplePoint, rayToSun, planetPosition, planetRadius, t2, t3)) {
                        nbLightSources -= 1;
                    }
                }
                if(nbLightSources == 0) ringShadeColor *= 0.1;

                finalColor = vec4(lerp(ringShadeColor, screenColor.rgb, ringDensity), 1.0);
            }
		}
	}

    gl_FragColor = finalColor; // displaying the final color
}