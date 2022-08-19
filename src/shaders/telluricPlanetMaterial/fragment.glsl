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

varying vec3 vPosition; // position of the vertex in chunk
varying vec3 vNormal; // normal of the vertex in sphere space
varying vec3 vLocalPosition;

uniform mat4 world;

uniform vec3 playerPosition; // camera position in world space
uniform float cameraNear;
uniform float cameraFar;

uniform vec3 planetPosition;

#define MAX_STARS 5
uniform vec3 starPositions[MAX_STARS]; // positions of the stars in world space
uniform int nbStars; // number of stars

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

//https://www.desmos.com/calculator/8etk6vdfzi

#pragma glslify: smoothSharpener = require(../utils/smoothSharpener.glsl)

#pragma glslify: rayIntersectSphere = require(../utils/rayIntersectSphere.glsl)

#pragma glslify: saturate = require(../utils/saturate.glsl)

#pragma glslify: waterBoilingPointCelsius = require(./utils/waterBoilingPointCelsius.glsl)

#pragma glslify: computeTemperature01 = require(./utils/computeTemperature01.glsl, vUnitSamplePoint=vUnitSamplePoint, fractalSimplex4=fractalSimplex4)

void main() {
	vec3 viewRayW = normalize(playerPosition - vPositionW); // view direction in world space

	vec3 sphereNormalW = vSphereNormalW;
	float ndl1 = 0.0;

	for(int i = 0; i < nbStars; i++) {
		vec3 starLightRayW = normalize(starPositions[i] - vPositionW); // light ray direction in world space
		ndl1 += max(dot(sphereNormalW, starLightRayW), 0.0);
	}
	ndl1 = saturate(ndl1);

	vec4 seededSamplePoint = vec4(vUnitSamplePoint, seed);

	float latitude = vUnitSamplePoint.y;
	float absLatitude01 = abs(latitude);
	
	float elevation = length(vSamplePoint) - planetRadius;

	float elevation01 = elevation / maxElevation;
	float waterLevel01 = waterLevel / maxElevation;

	float slope = smoothstep(0.2, 0.5, 1.0 - max(dot(vUnitSamplePoint, vNormal), 0.0));

	/// Analyse Physique de la planète

	float dayDuration = 1.0;
	
	// pressions
	//float waterSublimationPression = 0.006; //https://www.wikiwand.com/en/Sublimation_(phase_transition)#/Water
	
	// Temperatures
	
	float waterMeltingPoint = 0.0; // fairly good approximation
	float waterMeltingPoint01 = (waterMeltingPoint - minTemperature) / (maxTemperature - minTemperature);
	float waterBoilingPoint01 = (waterBoilingPointCelsius(pressure) - minTemperature) / (maxTemperature - minTemperature);

	//https://qph.fs.quoracdn.net/main-qimg-6a0fa3c05fb4db3d7d081680aec4b541
	//float co2SublimationTemperature = 0.0; // https://www.wikiwand.com/en/Sublimation_(phase_transition)#/CO2
	// TODO: find the equation ; even better use a texture
	//float co2SublimationTemperature01 = (co2SublimationTemperature - minTemperature) / (maxTemperature - minTemperature);

	float temperature01 = computeTemperature01(elevation01, absLatitude01, ndl1, dayDuration);

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
	float moistureSharpness = 10.0;
	float moistureFactor = smoothSharpener(moisture01, moistureSharpness);

	vec3 plainColor2 = 0.8 * plainColor;
	vec3 plainColor = lerp(plainColor, plainColor2, smoothSharpener(fractalSimplex4(vec4(vUnitSamplePoint * 100.0, 0.0), 4, 2.0, 2.0), 5.0));


	float beachFactor = min(
		smoothstep(waterLevel01 - beachSize / maxElevation, waterLevel01, elevation01),
		smoothstep(waterLevel01 + beachSize / maxElevation, waterLevel01, elevation01)
	);
	beachFactor = smoothSharpener(beachFactor, 2.0);

	float steepFactor = smoothSharpener(slope, steepSharpness);

	if(elevation01 > waterLevel01) {

		plainFactor = moistureFactor;
		desertFactor = 1.0 - moistureFactor;

		// Snow
		// waterMeltingPoint01 * waterAmount : il est plus difficile de former de la neige quand y a moins d'eau
		float waterReducing = pow(min(waterAmount, 1.0), 0.3);
		snowFactor = smoothstep(1.1 * waterMeltingPoint01 * waterReducing, waterMeltingPoint01 * waterReducing, temperature01);
		snowFactor = smoothSharpener(snowFactor, 4.0);
		if(waterMeltingPoint01 < 0.0) snowFactor = 0.0;
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

	// template:
	// small scale
	// large scale

	// TODO: make uniforms
	float normalStrengthNear = 1.0;
	float normalStrengthFar = 0.2;

	normal = triplanarNormal(vSamplePoint, normal, bottomNormalMap, 0.001, normalSharpness, bottomFactor * normalStrengthNear);
	normal = triplanarNormal(vSamplePoint, normal, bottomNormalMap, 0.00001, normalSharpness, bottomFactor * normalStrengthFar);

	normal = triplanarNormal(vSamplePoint, normal, beachNormalMap, 0.001, normalSharpness, beachFactor * normalStrengthNear);
	normal = triplanarNormal(vSamplePoint, normal, beachNormalMap, 0.00001, normalSharpness, beachFactor * normalStrengthFar);

	normal = triplanarNormal(vSamplePoint, normal, plainNormalMap, 0.001, normalSharpness, plainFactor * normalStrengthNear);
	normal = triplanarNormal(vSamplePoint, normal, plainNormalMap, 0.00001, normalSharpness, plainFactor * normalStrengthFar);

	normal = triplanarNormal(vSamplePoint, normal, desertNormalMap, 0.001, normalSharpness, desertFactor * normalStrengthNear);
	normal = triplanarNormal(vSamplePoint, normal, desertNormalMap, 0.00001, normalSharpness, desertFactor * normalStrengthFar);

	normal = triplanarNormal(vSamplePoint, normal, snowNormalMap, 0.001, normalSharpness, snowFactor * normalStrengthNear);
	normal = triplanarNormal(vSamplePoint, normal, snowNormalMap, 0.00001, normalSharpness, snowFactor * normalStrengthFar);

	normal = triplanarNormal(vSamplePoint, normal, steepNormalMap, 0.001, normalSharpness, steepFactor * normalStrengthNear);
	normal = triplanarNormal(vSamplePoint, normal, steepNormalMap, 0.00001, normalSharpness, steepFactor * normalStrengthFar);


	vec3 normalW = normalize(vec3(world * vec4(normal, 0.0)));


	float ndl2 = 0.0; // dimming factor due to light inclination relative to vertex normal in world space
	float specComp = 0.0;
	for(int i = 0; i < nbStars; i++) {
		vec3 starLightRayW = normalize(starPositions[i] - vPositionW);
		float ndl2part = max(0.0, dot(normalW, starLightRayW));
		// removing light where light ray goes through the surface
		float t0, t1;
		//TODO: DO NOT HARDCODE
		if(rayIntersectSphere(vPositionW, starLightRayW, planetPosition, planetRadius, t0, t1)) {
			ndl2part *= smoothstep(3e5, 0.0, abs(t1 - t0));//1.0 / (1.0 + 1e-5 * (t1 - t0));
		}
		ndl2 += ndl2part;

		vec3 angleW = normalize(viewRayW + starLightRayW);
		specComp += max(0.0, dot(normalW, angleW));
	}
	ndl2 = saturate(ndl2);
	specComp = saturate(specComp);
	specComp = pow(specComp, 32.0);

    // TODO: finish this (uniforms...)
    //float smoothness = 0.7;
    //float specularAngle = fastAcos(dot(normalize(viewRayW + lightRayW), normalW));
    //float specularExponent = specularAngle / (1.0 - smoothness);
    //float specComp = exp(-specularExponent * specularExponent);

	// suppresion du reflet partout hors la neige
	specComp *= (color.r + color.g + color.b) / 3.0;
	specComp /= 2.0;

	vec3 screenColor = color.rgb * (ndl2 + specComp*ndl1);

	if(colorMode == 1) screenColor = lerp(vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), moisture01);
	if(colorMode == 2) screenColor = lerp(vec3(1.0, 0.0, 0.0), vec3(0.1, 0.2, 1.0), temperature01);
	if(colorMode == 3) screenColor = normal * 0.5 + 0.5;
	if(colorMode == 4) screenColor = vec3(elevation01);
	if(colorMode == 5) screenColor = vec3(1.0 - dot(normal, normalize(vSamplePoint)));
	if(colorMode == 6) screenColor = vec3(1.0 - slope);


	gl_FragColor = vec4(screenColor, 1.0); // apply color and lighting
	#ifdef LOGARITHMICDEPTH
    	gl_FragDepthEXT = log2(vFragmentDepth) * logarithmicDepthConstant * 0.5;
    #endif
} 