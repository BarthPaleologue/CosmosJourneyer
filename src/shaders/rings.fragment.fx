precision mediump float;

#define PI 3.1415926535897932
#define POINTS_FROM_CAMERA 10 // number sample points along camera ray
#define OPTICAL_DEPTH_POINTS 10 // number sample points along light ray

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
uniform mat4 world;

uniform float cameraNear; // camera minZ
uniform float cameraFar; // camera maxZ

uniform vec3 planetPosition; // planet position in world space
uniform float cloudLayerRadius; // atmosphere radius (calculate from planet center)
uniform float planetRadius; // planet radius
uniform float waterLevel; // water level

uniform mat4 planetWorldMatrix;

uniform float time;


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

float saturate(float value) {
    if(value < 0.0) return 0.0;
    if(value > 1.0) return 1.0;
    return value;
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

float ringDensityAtPoint(vec3 samplePoint) {
	vec3 samplePointPlanetSpace = samplePoint - planetPosition;

	float distanceToPlanet = length(samplePointPlanetSpace);

	if(distanceToPlanet < planetRadius * 1.5) return 0.0;
	if(distanceToPlanet > planetRadius * 2.5) return 0.0;
	
	// hypothèse des rayons parallèles
	vec3 rayToSun = normalize(sunPosition - planetPosition);
	float t0, t1;
	if(rayIntersectSphere(samplePoint, rayToSun, planetPosition, planetRadius, t0,t1)) {
		return 0.0;
	}

	//float detailNoiseValue = completeNoise(samplePointPlanetSpace * 0.01, 1, 0.5, 2.0);
	float detailNoiseValue = 1.0;

	float densityValue = completeNoise(vec3(distanceToPlanet) * 0.0001, 1, 0.5, 2.0);

    return densityValue * detailNoiseValue;
}

vec3 computeCloudCoverage(vec3 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
    float impactPoint, escapePoint;

    if (!(rayIntersectSphere(rayOrigin, rayDir, planetPosition, cloudLayerRadius, impactPoint, escapePoint))) {
        return originalColor; // if not intersecting with atmosphere, return original color
    }

	//impactPoint += 10000.0 * completeNoise(normalize(rayOrigin + impactPoint * rayDir), 5, 2.0, 2.0);

	float waterImpact, waterEscape;
    if(rayIntersectSphere(cameraPosition, rayDir, planetPosition, planetRadius + waterLevel, waterImpact, waterEscape)) {
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


    // traiter le cas où les deux points sont acceptables.

    vec3 samplePoint1 = rayOrigin + impactPoint * rayDir;
    vec3 samplePoint2 = rayOrigin + escapePoint * rayDir;

    vec3 samplePointPlanetSpace1 = vec3(inverse(planetWorldMatrix) * vec4(samplePoint1, 1.0));//samplePoint - planetPosition;
    vec3 samplePointPlanetSpace2 = vec3(inverse(planetWorldMatrix) * vec4(samplePoint2, 1.0));//samplePoint - planetPosition;

    vec3 planetNormal = normalize(samplePoint1 - planetPosition);


	//vec3 normal = triplanarNormal(samplePointPlanetSpace1, planetNormal, normalMap, 0.000002, 1.0, cloudDensity);
	vec3 normal = planetNormal;

    vec3 sunDir = normalize(sunPosition - planetPosition); // direction to the light source with parallel rays hypothesis

    float ndl = max(dot(planetNormal, sunDir), 0.0); // dimming factor due to light inclination relative to vertex normal in world space

    //TODO : en faire un uniform
    float smoothness = 0.7;
    float specularAngle = acos(dot(normalize(sunDir - rayDir), normal));
    float specularExponent = specularAngle / (1.0 - smoothness);
    float specularHighlight = exp(-specularExponent * specularExponent);

	vec3 ambiant = lerp(originalColor, vec3(ndl), 1.0);

    return ambiant + specularHighlight;
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

	float impactPoint;
	if(rayIntersectPlane(cameraPosition, rayDir, planetPosition, normalize(vec3(-0.2, 1.0, 0.0)), impactPoint)) {
		if(impactPoint < maximumDistance) {
			finalColor = vec3(1.0, 0.0, 0.0);
			vec3 samplePoint = cameraPosition + impactPoint * rayDir;
			float ringDensity = ringDensityAtPoint(samplePoint);
			vec3 ringColor = lerp(vec3(ringDensity), screenColor, 0.5);
			finalColor = lerp(ringColor, screenColor, ringDensity);
		} else {
			finalColor = screenColor;
		}
	} else {
		finalColor = screenColor;
	}

    gl_FragColor = vec4(finalColor, 1.0); // displaying the final color
}