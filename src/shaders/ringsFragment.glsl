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
uniform mat4 world;

uniform float cameraNear; // camera minZ
uniform float cameraFar; // camera maxZ

uniform vec3 planetPosition; // planet position in world space
uniform float planetRadius; // planet radius

uniform float ringStart; // ring start
uniform float ringEnd; // ring end
uniform float ringFrequency; // ring frequency
uniform float ringOpacity; // ring opacity

uniform vec4 planetRotationQuaternion;

float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}


float completeNoise(vec3 p, int nbOctaves, float decay, float lacunarity) {
	float totalAmplitude = 0.0;
	float value = 0.0;
	for(int i = 0; i < nbOctaves; ++i) {
		totalAmplitude += 1.0 / pow(decay, float(i));
		vec3 samplePoint = p * pow(lacunarity, float(i)); 
		value += noise(samplePoint) / pow(decay, float(i));
	}
	return value / totalAmplitude;
}

// remap a value comprised between low1 and high1 to a value between low2 and high2
float remap(float value, float low1, float high1, float low2, float high2) {
    return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
}

// compute the world position of a pixel from its uv coordinates
vec3 worldFromUV(vec2 pos) {
    vec4 ndc = vec4(pos.xy * 2.0 - 1.0, -1.0, 1.0); // get ndc position -1 because i want every point in the near camera plane
    vec4 posVS = inverse(projection) * ndc; // unproject the ndc coordinates : we are now in view space if i understand correctly
    vec4 posWS = inverse(view) * vec4((posVS.xyz / posVS.w), 1.0); // then we use inverse view to get to world space, division by w to get actual coordinates
    return posWS.xyz; // the coordinates in world space
}

// returns whether or not a ray hits a sphere, if yes out intersection points
// a good explanation of how it works : https://viclw17.github.io/2018/07/16/raytracing-ray-sphere-intersection/
bool rayIntersectSphere(vec3 rayOrigin, vec3 rayDir, vec3 spherePosition, float sphereRadius, out float t0, out float t1) {
    vec3 relativeOrigin = rayOrigin - spherePosition; // rayOrigin in sphere space

    float a = 1.0;
    float b = 2.0 * dot(relativeOrigin, rayDir);
    float c = dot(relativeOrigin, relativeOrigin) - sphereRadius*sphereRadius;
    
    float d = b*b - 4.0*a*c;

    if(d < 0.0) return false; // no intersection

    float s = sqrt(d);

    float r0 = (-b - s) / (2.0*a);
    float r1 = (-b + s) / (2.0*a);

    t0 = min(r0, r1);
    t1 = max(r0, r1);

    return (t1 > 0.0);
}

bool rayIntersectPlane(vec3 rayOrigin, vec3 rayDir, vec3 planetPosition, vec3 planeNormal, out float t) {
	float denom = dot(rayDir, planeNormal);
	if(abs(denom) <= 0.001) return false; // ray is parallel to the plane
	t = dot(planeNormal, planetPosition - rayOrigin) / dot(planeNormal, rayDir);
	return (t > 0.0);
}

vec3 lerp(vec3 v1, vec3 v2, float s) {
    return s * v1 + (1.0 - s) * v2;
}

vec3 applyQuaternion(vec4 quaternion, vec3 vector) {
    float qx = quaternion.x;
    float qy = quaternion.y;
    float qz = quaternion.z;
    float qw = quaternion.w;
    float x = vector.x;
    float y = vector.y;
    float z = vector.z;
    // apply quaternion to vector
    float ix = qw * x + qy * z - qz * y;
    float iy = qw * y + qz * x - qx * z;
    float iz = qw * z + qx * y - qy * x;
    float iw = -qx * x - qy * y - qz * z;
    // calculate result * inverse quat
    float nX = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    float nY = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    float nZ = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return vec3(nX, nY, nZ);
}

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