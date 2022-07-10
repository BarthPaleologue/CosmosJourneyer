precision highp float;

#ifdef LOGARITHMICDEPTH
	uniform float logarithmicDepthConstant;
	varying float vFragmentDepth;
#endif

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec3 vUnitSamplePoint;
varying vec3 vSphereNormalW;
varying vec3 vSamplePoint;

varying vec3 vPosition; // position of the vertex in sphere space
varying vec3 vNormal; // normal of the vertex in sphere space

uniform mat4 world;

uniform vec3 playerPosition; // camera position in world space
uniform float cameraNear;
uniform float cameraFar;
uniform vec3 sunPosition; // light position in world space
uniform vec3 planetPosition;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler; // evaluate sceneDepth

uniform int colorMode;

uniform sampler2D bottomNormalMap;
uniform sampler2D plainNormalMap;

uniform sampler2D beachNormalMap;
uniform sampler2D desertNormalMap;

uniform sampler2D snowNormalMap;
uniform sampler2D snowNormalMap2;

uniform sampler2D steepNormalMap;

uniform float seed;

uniform float planetRadius; // planet radius
uniform float waterLevel; // controls sand layer
uniform float beachSize;

uniform float steepSharpness; // sharpness of demaracation between steepColor and normal colors
uniform float normalSharpness;

uniform float maxElevation;

uniform vec3 snowColor; // the color of the snow layer
uniform vec3 steepColor; // the color of steep slopes
uniform vec3 plainColor; // the color of plains at the bottom of moutains
uniform vec3 beachColor; // the color of the sand
uniform vec3 desertColor;
uniform vec3 bottomColor;

uniform float pressure;
uniform float minTemperature;
uniform float maxTemperature;

uniform float waterAmount;

#pragma glslify: fractalSimplex4 = require(../utils/simplex4.glsl)

#pragma glslify: fastAcos = require(../utils/fastAcos.glsl)

#pragma glslify: remap = require(../utils/remap.glsl)

#pragma glslify: lerp = require(../utils/vec3Lerp.glsl)

float lerp(float value1, float value2, float x) {
	return x * value1 + (1.0 - x) * value2;
}

#pragma glslify: triplanarNormal = require(../utils/triplanarNormal.glsl)

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

//https://www.desmos.com/calculator/8etk6vdfzi

float tanh01(float x) {
	return (tanh(x) + 1.0) / 2.0;
} 

float tanherpFactor(float x, float s) {
	float sampleValue = (x - 0.5) * s;
	return tanh01(sampleValue);
}

vec3 tanherp(vec3 value1, vec3 value2, float x, float s) {
	float alpha = tanherpFactor(x, s);

	return lerp(value1, value2, alpha);
}

#pragma glslify: saturate = require(../utils/saturate.glsl)

#pragma glslify: waterBoilingPointCelsius = require(./utils/waterBoilingPointCelsius.glsl)

#pragma glslify: computeTemperature01 = require(./utils/computeTemperature01.glsl, vUnitSamplePoint=vUnitSamplePoint, fractalSimplex4=fractalSimplex4, tanh=tanh)

void main() {
	vec3 viewRayW = normalize(playerPosition - vPositionW); // view direction in world space
	vec3 lightRayW = normalize(sunPosition - vPositionW); // light ray direction in world space

	vec3 sphereNormalW = vSphereNormalW;
	float ndl = max(0.002, dot(sphereNormalW, lightRayW));

	vec4 seededSamplePoint = vec4(vUnitSamplePoint, seed);

	float latitude = vUnitSamplePoint.y;
	float absLatitude01 = abs(latitude);
	
	float elevation = length(vSamplePoint) - planetRadius;

	float elevation01 = elevation / maxElevation;
	float waterLevel01 = waterLevel / maxElevation;

	float slope = 1.0 - dot(vUnitSamplePoint, vNormal);

	/// Analyse Physique de la planète

	float dayDuration = 1.0;
	
	// pressions
	float waterSublimationPression = 0.006; //https://www.wikiwand.com/en/Sublimation_(phase_transition)#/Water
	
	// Temperatures
	
	float waterMeltingPoint = 0.0; // fairly good approximation
	float waterMeltingPoint01 = (waterMeltingPoint - minTemperature) / (maxTemperature - minTemperature);
	float waterBoilingPoint01 = (waterBoilingPointCelsius(pressure) - minTemperature) / (maxTemperature - minTemperature);

	//https://qph.fs.quoracdn.net/main-qimg-6a0fa3c05fb4db3d7d081680aec4b541
	float co2SublimationTemperature = 0.0; // https://www.wikiwand.com/en/Sublimation_(phase_transition)#/CO2
	// TODO: find the equation ; even better use a texture
	float co2SublimationTemperature01 = (co2SublimationTemperature - minTemperature) / (maxTemperature - minTemperature);

	float temperature01 = computeTemperature01(elevation01, absLatitude01, ndl, dayDuration);

	float temperature = lerp(maxTemperature, minTemperature, temperature01);

	// moisture
	float moisture01 = 0.0; // 0.0 = sec, 1.0 = humid : sec par défaut
	if(waterMeltingPoint01 < 1.0) {
		// if there is liquid water on the surface
		moisture01 += fractalSimplex4(seededSamplePoint * 2.0, 5, 1.7, 2.2) * sqrt(1.0-waterMeltingPoint01) * waterBoilingPoint01;
	}
	if(pressure == 0.0) {
	    moisture01 += fractalSimplex4(seededSamplePoint * 5.0, 5, 1.7, 2.2);
	}
	moisture01 = clamp(moisture01, 0.0, 1.0);

	// calcul de la couleur et de la normale
	vec3 normal = vNormal;

	float plainFactor = 0.0,
	desertFactor = 0.0,
	bottomFactor = 0.0,
	snowFactor = 0.0;

	// hard separation between wet and dry
	float moistureSharpness = 20.0;
	float moistureFactor = tanherpFactor(moisture01, moistureSharpness);

	vec3 plainColor2 = 0.7 * plainColor;
	vec3 plainColor = tanherp(plainColor, plainColor2, fractalSimplex4(vec4(vUnitSamplePoint * 100.0, 0.0), 4, 2.0, 2.0), 10.0);


	float beachFactor = getLnearFactor(elevation01, waterLevel01, beachSize / maxElevation);

	float steepFactor = remap(slope, 0.0, 0.9, 0.0, 1.0);
	steepFactor = saturate(steepFactor);
	steepFactor = tanherpFactor(steepFactor, steepSharpness);

	if(elevation01 > waterLevel01) {

		plainFactor = moistureFactor;
		desertFactor = 1.0 - moistureFactor;

		// Snow
		// waterMeltingPoint01 * waterAmount : il est plus difficile de former de la neige quand y a moins d'eau
		snowFactor = tanh01((waterMeltingPoint01 * min(waterAmount, 1.0) - temperature01) * 64.0);
		plainFactor *= 1.0 - snowFactor;
		desertFactor *= 1.0 - snowFactor;

		// Beach
		desertFactor *= 1.0 - beachFactor;
		plainFactor *= 1.0 - beachFactor;
		snowFactor *= 1.0 - beachFactor;

		// Steep
		beachFactor *= 1.0 - steepFactor;
		desertFactor *= 1.0 - steepFactor;
		plainFactor *= 1.0 - steepFactor;
		snowFactor *= 1.0 - steepFactor;
	} else {
		// entre abysse et surface
		bottomFactor = 1.0 - beachFactor;

		beachFactor *= 1.0 - steepFactor;
		bottomFactor *= 1.0 - steepFactor;
	}

	vec3 color = steepFactor * steepColor
	+ beachFactor * beachColor
	+ desertFactor * desertColor
	+ plainFactor * plainColor
	+ snowFactor * snowColor
	+ bottomFactor * bottomColor;

	normal = triplanarNormal(vSamplePoint, normal, bottomNormalMap, 0.001, normalSharpness, bottomFactor);
	normal = triplanarNormal(vSamplePoint, normal, bottomNormalMap, 0.00001, normalSharpness, bottomFactor);

	normal = triplanarNormal(vSamplePoint, normal, beachNormalMap, 0.001, normalSharpness, beachFactor);
	normal = triplanarNormal(vSamplePoint, normal, beachNormalMap, 0.0001, normalSharpness, beachFactor);

	normal = triplanarNormal(vSamplePoint, normal, plainNormalMap, 0.001, normalSharpness, plainFactor);
	normal = triplanarNormal(vSamplePoint, normal, plainNormalMap, 0.00001, normalSharpness, plainFactor);

	normal = triplanarNormal(vSamplePoint, normal, desertNormalMap, 0.001, normalSharpness, desertFactor);
	normal = triplanarNormal(vSamplePoint, normal, desertNormalMap, 0.00001, normalSharpness, desertFactor);

	normal = triplanarNormal(vSamplePoint, normal, snowNormalMap, 0.001, normalSharpness, snowFactor);
	normal = triplanarNormal(vSamplePoint, normal, snowNormalMap, 0.00001, normalSharpness, snowFactor);

	normal = triplanarNormal(vSamplePoint, normal, steepNormalMap, 0.001, normalSharpness, steepFactor);
	normal = triplanarNormal(vSamplePoint, normal, steepNormalMap, 0.00001, normalSharpness, steepFactor);






	vec3 normalW = normalize(vec3(world * vec4(normal, 0.0)));

	float ndl2 = max(0.0, dot(normalW, lightRayW)); // dimming factor due to light inclination relative to vertex normal in world space

	// specular
	vec3 angleW = normalize(viewRayW + lightRayW);
    float specComp = max(0., dot(normalW, angleW));
    specComp = pow(specComp, 32.0);

    // TODO: finish this (uniforms...)
    /*float smoothness = 0.7;
    float specularAngle = fastAcos(dot(normalize(viewRayW + lightRayW), normalW));
    float specularExponent = specularAngle / (1.0 - smoothness);
    float specComp = exp(-specularExponent * specularExponent);*/

	// suppresion du reflet partout hors la neige
	specComp *= (color.r + color.g + color.b) / 3.0;
	specComp /= 2.0;

	vec3 screenColor = color.rgb * (sqrt(ndl*ndl2) + specComp*ndl);

	if(colorMode == 1) screenColor = lerp(vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), moisture01);
	if(colorMode == 2) screenColor = lerp(vec3(1.0, 0.0, 0.0), vec3(0.1, 0.2, 1.0), temperature01);
	if(colorMode == 3) screenColor = normal*0.5 + 0.5;
	if(colorMode == 4) screenColor = vec3(elevation01);
	if(colorMode == 5) screenColor = vec3(1.0 - dot(normal, normalize(vSamplePoint)));

	gl_FragColor = vec4(screenColor, 1.0); // apply color and lighting
	#ifdef LOGARITHMICDEPTH
    	gl_FragDepthEXT = log2(vFragmentDepth) * logarithmicDepthConstant * 0.5;
    #endif
} 