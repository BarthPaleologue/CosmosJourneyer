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

uniform sampler2D bottomNormalMap;
uniform sampler2D plainNormalMap;
uniform sampler2D sandNormalMap;
uniform sampler2D snowNormalMap;
uniform sampler2D steepNormalMap;

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

vec3 triplanarNormal(vec3 position, vec3 surfaceNormal, float bottomFactor, float sandFactor, float plainFactor, float snowFactor, float steepFactor, float scale, float sharpness, float normalStrength) {

	vec3 tBottomNormalX = texture2D(bottomNormalMap, position.zy * scale).rgb;
    vec3 tBottomNormalY = texture2D(bottomNormalMap, position.xz * scale).rgb;
    vec3 tBottomNormalZ = texture2D(bottomNormalMap, position.xy * scale).rgb;

	vec3 tSandNormalX = texture2D(sandNormalMap, position.zy * scale).rgb;
    vec3 tSandNormalY = texture2D(sandNormalMap, position.xz * scale).rgb;
    vec3 tSandNormalZ = texture2D(sandNormalMap, position.xy * scale).rgb;

	vec3 tPlainNormalX = texture2D(plainNormalMap, position.zy * scale).rgb;
    vec3 tPlainNormalY = texture2D(plainNormalMap, position.xz * scale).rgb;
    vec3 tPlainNormalZ = texture2D(plainNormalMap, position.xy * scale).rgb;

	vec3 tSnowNormalX = texture2D(snowNormalMap, position.zy * scale).rgb;
    vec3 tSnowNormalY = texture2D(snowNormalMap, position.xz * scale).rgb;
    vec3 tSnowNormalZ = texture2D(snowNormalMap, position.xy * scale).rgb;

	vec3 tSteepNormalX = texture2D(steepNormalMap, position.zy * scale).rgb;
    vec3 tSteepNormalY = texture2D(steepNormalMap, position.xz * scale).rgb;
    vec3 tSteepNormalZ = texture2D(steepNormalMap, position.xy * scale).rgb;

	float totalAmplitude = bottomFactor + sandFactor + plainFactor + snowFactor;

	vec3 tNormalX = bottomFactor * tBottomNormalX;
	tNormalX += sandFactor * tSandNormalX;
	tNormalX += plainFactor * tPlainNormalX;
	tNormalX += snowFactor * tSnowNormalX;
	tNormalX /= totalAmplitude;

	vec3 tNormalY = bottomFactor * tBottomNormalY;
	tNormalY += sandFactor * tSandNormalY;
	tNormalY += plainFactor * tPlainNormalY;
	tNormalY += snowFactor * tSnowNormalY;
	tNormalY /= totalAmplitude;

	vec3 tNormalZ = bottomFactor * tBottomNormalZ;
	tNormalZ += sandFactor * tSandNormalZ;
	tNormalZ += plainFactor * tPlainNormalZ;
	tNormalZ += snowFactor * tSnowNormalZ;
	tNormalZ /= totalAmplitude;

	tNormalX = lerp(tNormalX, tSteepNormalX, steepFactor);
	tNormalY = lerp(tNormalY, tSteepNormalY, steepFactor);
	tNormalZ = lerp(tNormalZ, tSteepNormalZ, steepFactor);

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

void getGradientFactors(float relativeElevation, float latitude, out float bottomFactor, out float sandFactor,
out float plainFactor, out float snowFactor) {
	float maxElevation = 10300.0; // voir dans builder avec les différents layer pour adapter
	float relativeWaterLevel = waterLevel/maxElevation;

	bottomFactor = getLnearFactor(relativeElevation, 0.0, 0.05);

	sandFactor = getLnearFactor(relativeElevation, relativeWaterLevel, sandSize / maxElevation);
	
	plainFactor = getLnearFactor(relativeElevation, 0.3, 0.3);
	
	snowFactor = getLnearFactor(relativeElevation, 0.6, 0.3) * abs(latitude);
}

vec3 softGradient(float relativeElevation, float latitude, vec3 normal) {
	float maxElevation = 10300.0; // voir dans builder avec les différents layer pour adapter
	float relativeWaterLevel = waterLevel/maxElevation;

	float bottomFactor = getLnearFactor(relativeElevation, 0.0, 0.05);

	float sandFactor = getLnearFactor(relativeElevation, relativeWaterLevel, sandSize / maxElevation);
	
	float plainFactor = getLnearFactor(relativeElevation, 0.2, 0.3);
	
	float snowFactor = getLnearFactor(relativeElevation, 0.6, 0.3) * abs(latitude);

	float totalAmplitude = bottomFactor + sandFactor + plainFactor + snowFactor;

	vec3 bottomColor = vec3(0.5);

	vec3 color = bottomFactor * bottomColor + sandFactor * sandColor + plainFactor * plainColor + snowFactor * snowColor;
	color /= totalAmplitude;

	return color;
}

void main() {

	vec3 viewDirectionW = normalize(v3CameraPos - vPositionW); // view direction in world space

	float distance = length(v3CameraPos - vPositionW);




	vec3 unitPosition = normalize(vPosition);
	
	float elevation = length(vPosition) - planetRadius;
	float maxElevation = 10300.0; // voir dans builder avec les différents layer pour adapter

	float relativeElevation = elevation/maxElevation;
	relativeElevation = max(0.0, relativeElevation);

	float latitude = unitPosition.y;

	float bottomFactor, sandFactor, plainFactor, snowFactor;
	getGradientFactors(relativeElevation, latitude, bottomFactor, sandFactor, plainFactor, snowFactor);

	float totalAmplitude = bottomFactor + sandFactor + plainFactor + snowFactor;

	vec3 bottomColor = vec3(0.5);
	
	vec3 color = vec3(0.0);
	color += bottomFactor * bottomColor;
	color += sandFactor * sandColor;
	color += plainFactor * plainColor;
	color += snowFactor * snowColor;

	color /= totalAmplitude;


	float d = dot(unitPosition, vNormal);
	float d2 = pow(d, steepSharpness);
	color = lerp(color, steepColor, d2);

	vec3 normal = vNormal;

	normal = triplanarNormal(vPosition, normal, bottomFactor, sandFactor, plainFactor, snowFactor, d2, 0.001, 1.0, 0.2);
	normal = triplanarNormal(vPosition, normal, bottomFactor, sandFactor, plainFactor, snowFactor, d2, 0.0003, 1.0, 0.6); // plus grand

	vec3 normalW = normalize(vec3(world * vec4(normal, 0.0)));

	vec3 lightRay = normalize(v3LightPos - vPositionW); // light ray direction in world space
	vec3 parallelLightRay = normalize(v3LightPos - planetPosition); // light ray direction in world space
	
	

	float ndl = max(0., dot(normalW, parallelLightRay)); // dimming factor due to light inclination relative to vertex normal in world space

	// specular
	vec3 angleW = normalize(viewDirectionW + lightRay);
    float specComp = max(0., dot(normalW, angleW));
    specComp = pow(specComp, 64.0);

	//color = vec3(relativeElevation);

	vec3 screenColor = color.rgb * ndl * (1.0+ vec3(specComp)/10.0);

	gl_FragColor = vec4(screenColor, 1.0); // apply color and lighting	
} 