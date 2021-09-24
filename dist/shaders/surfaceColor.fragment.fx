precision highp float;

// Lights
varying vec3 vPositionW;
varying vec3 vNormalW;

// Refs

uniform mat4 world;

uniform vec3 v3CameraPos; // camera position in world space
uniform float cameraNear;
uniform float cameraFar;
uniform vec3 v3LightPos; // light position in world space
uniform vec3 planetPosition;
uniform mat4 view;
uniform mat4 projection;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler; // evaluate sceneDepth

uniform sampler2D normalMap;

uniform float planetRadius; // planet radius
uniform float waterLevel; // controls sand layer
uniform float sandSize;

uniform float steepSharpness; // sharpness of demaracation between steepColor and normal colors

uniform vec3 snowColor; // the color of the snow layer
uniform vec3 steepColor; // the color of steep slopes
uniform vec3 plainColor; // the color of plains at the bottom of moutains
uniform vec3 sandColor; // the color of the sand
vec3 toundraColor = vec3(40.0, 40.0, 40.0) / 255.0;

varying vec3 vPosition; // position of the vertex in sphere space
varying vec3 vNormal; // normal of the vertex in sphere space
varying vec2 vUV; // 

// Noise functions to spice things up a little bit
#define M_PI 3.14159265358979323846

float rand(vec2 co){return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);}
float rand (vec2 co, float l) {return rand(vec2(rand(co), l));}
float rand (vec2 co, float l, float t) {return rand(vec2(rand(co, l), t));}

float perlin(vec2 p, float dim, float time) {
	vec2 pos = floor(p * dim);
	vec2 posx = pos + vec2(1.0, 0.0);
	vec2 posy = pos + vec2(0.0, 1.0);
	vec2 posxy = pos + vec2(1.0);
	
	float c = rand(pos, dim, time);
	float cx = rand(posx, dim, time);
	float cy = rand(posy, dim, time);
	float cxy = rand(posxy, dim, time);
	
	vec2 d = fract(p * dim);
	d = -0.5 * cos(d * M_PI) + 0.5;
	
	float ccx = mix(c, cx, d.x);
	float cycxy = mix(cy, cxy, d.x);
	float center = mix(ccx, cycxy, d.y);
	
	return center * 2.0 - 1.0;
}

float remap(float value, float low1, float high1, float low2, float high2) {
    return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
}

vec3 lerp(vec3 vector1, vec3 vector2, float x) {
	return x * vector1 + (1.0 - x) * vector2;
}

vec3 triplanarNormal(vec3 position, vec3 surfaceNormal, sampler2D normalMap, float scale, float sharpness, float normalStrength) {
    vec3 tNormalX = texture2D(normalMap, position.zy * scale).rgb;
    vec3 tNormalY = texture2D(normalMap, position.xz * scale).rgb;
    vec3 tNormalZ = texture2D(normalMap, position.xy * scale).rgb;

    tNormalX = vec3(normalStrength * tNormalX.xy + surfaceNormal.zy, tNormalX.z * surfaceNormal.x);
    tNormalY = vec3(normalStrength * tNormalY.xy + surfaceNormal.xz, tNormalY.z * surfaceNormal.y);
    tNormalZ = vec3(normalStrength * tNormalZ.xy + surfaceNormal.xy, tNormalZ.z * surfaceNormal.z);

    vec3 blendWeight = pow(abs(vNormal), vec3(sharpness));
    blendWeight /= dot(blendWeight, vec3(1.0));

    return normalize(tNormalX.zyx * blendWeight.x + tNormalY.xzy * blendWeight.y + tNormalZ.xyz * blendWeight.z);
}

bool near(float value, float reference, float range) {
	return abs(reference - value) < range; 
}

/*
 * Get lerp factor around summit with certain slope (triangle function)
 */
float getLnearFactor(float x, float summitX, float range) {
	float lnearFactor = 0.0;
	if(x >= summitX) lnearFactor = max(-x/range + 1.0 + summitX/range, 0.0);
	else lnearFactor = max(x/range + 1.0 - summitX/range, 0.0);
	
	float blendingSharpness = 1.0;
	lnearFactor = pow(lnearFactor, blendingSharpness);

	return lnearFactor;
}

/*
 * Get lerp value around summit with certain slope (triangle function)
 */
vec3 lnear(vec3 value1, vec3 value2, float x, float summitX, float range) {
	float lnearFactor = getLnearFactor(x, summitX, range);
	
	return lerp(value1, value2, lnearFactor);
}



vec3 hardSurfaceGradient(float relativeElevation) {

	float maxElevation = 10300.0; // voir dans builder avec les différents layer pour adapter
	
	float relativeWaterLevel = waterLevel/maxElevation;


	vec3 color = float(near(relativeElevation, relativeWaterLevel, 0.01)) * sandColor;
	color += float(near(relativeElevation, 0.1, 0.2)) * plainColor;
	color += float(near(relativeElevation, 0.5, 0.2)) * snowColor;
	return color;
}

vec3 softGradient(float relativeElevation, float latitude) {
	float maxElevation = 10300.0; // voir dans builder avec les différents layer pour adapter
	float relativeWaterLevel = waterLevel/maxElevation;

	float sandFactor = getLnearFactor(relativeElevation, relativeWaterLevel, sandSize / maxElevation)* (1.0 - pow(latitude, 2.0));
	
	float plainFactor = getLnearFactor(relativeElevation, 0.2, 0.2) * (1.0 - pow(latitude, 2.0));
	
	float snowFactor = getLnearFactor(relativeElevation, 0.3, 0.4) * pow(latitude, 2.0);

	float totalAmplitude = sandFactor + plainFactor + snowFactor;

	vec3 color = sandFactor * sandColor + plainFactor * plainColor + snowFactor * snowColor;
	color /= totalAmplitude;

	return color;
}

void main() {

	vec3 viewDirectionW = normalize(v3CameraPos - vPositionW); // view direction in world space

	float distance = length(v3CameraPos - vPositionW);

	vec3 normal = vNormal;

	//if(distance < 10000.0) {
	normal = triplanarNormal(vPosition, vNormal, normalMap, 0.05, 1.0, 0.2);
	normal = triplanarNormal(vPosition, normal, normalMap, 0.001, 1.0, 0.2);
	normal = triplanarNormal(vPosition, normal, normalMap, 0.0001, 1.0, 0.2);
	//}

	vec3 sphereNormal = triplanarNormal(vPosition, normalize(vPosition), normalMap, 0.05, 1.0, 0.2);
	sphereNormal = triplanarNormal(vPosition, sphereNormal, normalMap, 0.001, 1.0, 0.2);
	sphereNormal = triplanarNormal(vPosition, sphereNormal, normalMap, 0.0001, 1.0, 0.2);
	sphereNormal = triplanarNormal(vPosition, sphereNormal, normalMap, 0.00001, 1.0, 0.2);


	vec3 normalW = normalize(vec3(world * vec4(normal, 0.0)));

	vec3 lightRay = normalize(v3LightPos - vPositionW); // light ray direction in world space
	vec3 parallelLightRay = normalize(v3LightPos - planetPosition); // light ray direction in world space
	
	vec3 color = vec3(0.0); // color of the pixel (default doesn't matter)

	float ndl = max(0., dot(normalW, parallelLightRay)); // dimming factor due to light inclination relative to vertex normal in world space

	// specular
	vec3 angleW = normalize(viewDirectionW + lightRay);
    float specComp = max(0., dot(normalW, angleW));
    specComp = pow(specComp, 64.0);


	vec3 unitPosition = normalize(vPosition);
	
	float elevation = length(vPosition) - planetRadius;
	float maxElevation = 10300.0; // voir dans builder avec les différents layer pour adapter

	float relativeElevation = elevation/maxElevation;
	relativeElevation = max(0.0, relativeElevation);

	float latitude = unitPosition.y;

	color = softGradient(relativeElevation, latitude);

	float d = dot(unitPosition, vNormal);
	float d2 = pow(d, steepSharpness);
	color = lerp(color, steepColor, d2);

	//color = vec3(relativeElevation);

	vec3 screenColor = color.rgb * ndl + vec3(specComp) * 0.01;

	gl_FragColor = vec4(screenColor, 1.0); // apply color and lighting	
} 