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
varying vec3 vSamplePointScaled;

varying vec3 vPosition; // position of the vertex in chunk
varying vec3 vNormal; // normal of the vertex in sphere space
varying vec3 vLocalPosition;

uniform mat4 normalMatrix;

uniform vec3 playerPosition; // camera position in world space
uniform float cameraNear;
uniform float cameraFar;

uniform vec3 planetPosition;

#define MAX_STARS 5
uniform vec3 starPositions[MAX_STARS]; // positions of the stars in world space
uniform int nbStars; // number of stars

uniform int colorMode;

uniform sampler2D bottomNormalMap;
uniform sampler2D plainNormalMap;

uniform sampler2D beachNormalMap;
uniform sampler2D desertNormalMap;

uniform sampler2D snowNormalMap;

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

#pragma glslify: perlin3 = require(../utils/perlin3.glsl)

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

#pragma glslify: computeTemperature01 = require(./utils/computeTemperature01.glsl)

void main() {
	vec3 viewRayW = normalize(playerPosition - vPositionW); // view direction in world space

	vec3 sphereNormalW = vSphereNormalW;
	
	// diffuse lighting extinction
	float ndl1 = 0.0;
	for(int i = 0; i < nbStars; i++) {
		vec3 starLightRayW = normalize(starPositions[i] - vPositionW); // light ray direction in world space
		ndl1 += max(dot(sphereNormalW, starLightRayW), 0.0);
	}
	ndl1 = saturate(ndl1);

	//FIXME: should use the angle between the axis and the normal
	float latitude = acos(vUnitSamplePoint.y) - 3.1415 / 2.0;
	//float latitude = vUnitSamplePoint.y;
	float absLatitude01 = abs(latitude);
	
	float elevation = length(vSamplePoint) - planetRadius;

	float elevation01 = elevation / maxElevation;
	float waterLevel01 = waterLevel / maxElevation;

	float slope = 1.0 - abs(dot(vUnitSamplePoint, vNormal));

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
		moisture01 += 0.5 * (1.0 + perlin3(vUnitSamplePoint * 2.0)) * sqrt(1.0-waterMeltingPoint01) * waterBoilingPoint01;
	}
	if(pressure == 0.0) {
	    moisture01 += 0.5 * (1.0 + perlin3(vUnitSamplePoint * 5.0));
	}
	moisture01 = clamp(moisture01, 0.0, 1.0);


	vec3 blendingNormal = vNormal;
	blendingNormal = triplanarNormal(vSamplePointScaled, blendingNormal, snowNormalMap, 0.0001 * 1000e3, normalSharpness, 1.0);
	

	// calcul de la couleur et de la normale
	vec3 normal = vNormal;

	float plainFactor = 0.0,
	desertFactor = 0.0,
	bottomFactor = 0.0,
	snowFactor = 0.0;

	// hard separation between wet and dry
	float moistureSharpness = 10.0;
	float moistureFactor = smoothSharpener(moisture01, moistureSharpness);

	vec3 plainColor = plainColor * (moisture01 * 0.5 + 0.5);

	float beachFactor = min(
		smoothstep(waterLevel01 - beachSize / maxElevation, waterLevel01, elevation01),
		smoothstep(waterLevel01 + beachSize / maxElevation, waterLevel01, elevation01)
	);
	beachFactor = smoothSharpener(beachFactor, 2.0);

	float steepFactor = slope;//smoothSharpener(slope, steepSharpness);
	steepFactor = smoothstep(0.3, 0.7, steepFactor);
	steepFactor = smoothSharpener(steepFactor, steepSharpness);

	plainFactor = 1.0 - steepFactor;

	// apply beach factor
	plainFactor *= 1.0 - beachFactor;
	beachFactor *= 1.0 - steepFactor;

	// blend with snow factor when above water
	snowFactor = smoothstep(0.0, -2.0, temperature - abs(blendingNormal.y) * 5.0);
	snowFactor = smoothSharpener(snowFactor, 2.0);
	plainFactor *= 1.0 - snowFactor;
	beachFactor *= 1.0 - snowFactor;

	// blend with desert factor when above water
	desertFactor = smoothstep(0.5, 0.3, moisture01);
	desertFactor = smoothSharpener(desertFactor, 2.0);
	plainFactor *= 1.0 - desertFactor;
	beachFactor *= 1.0 - desertFactor;


	// blend with bottom factor when under water
	bottomFactor = smoothstep(waterLevel01, waterLevel01 - 1e-2, elevation01);
	bottomFactor = smoothSharpener(bottomFactor, 2.0);
	plainFactor *= 1.0 - bottomFactor;
	beachFactor *= 1.0 - bottomFactor;
	snowFactor *= 1.0 - bottomFactor;
	desertFactor *= 1.0 - bottomFactor;

	// template:
	// small scale
	// large scale

	// TODO: make uniforms
	const float normalStrengthNear = 0.5;
	const float normalStrengthFar = 0.2;

	const float nearScale = 0.005 * 1000e3;
	const float farScale = 0.00001 * 1000e3;

	normal = triplanarNormal(vSamplePointScaled, normal, bottomNormalMap, nearScale, normalSharpness, bottomFactor * normalStrengthNear);
	normal = triplanarNormal(vSamplePointScaled, normal, bottomNormalMap, farScale, normalSharpness, bottomFactor * normalStrengthFar);

	normal = triplanarNormal(vSamplePointScaled, normal, beachNormalMap, nearScale, normalSharpness, beachFactor * normalStrengthNear);
	normal = triplanarNormal(vSamplePointScaled, normal, beachNormalMap, farScale, normalSharpness, beachFactor * normalStrengthFar);

	normal = triplanarNormal(vSamplePointScaled, normal, plainNormalMap, nearScale, normalSharpness, plainFactor * normalStrengthNear);
	normal = triplanarNormal(vSamplePointScaled, normal, plainNormalMap, farScale, normalSharpness, plainFactor * normalStrengthFar);

	normal = triplanarNormal(vSamplePointScaled, normal, desertNormalMap, nearScale, normalSharpness, desertFactor * normalStrengthNear);
	normal = triplanarNormal(vSamplePointScaled, normal, desertNormalMap, farScale, normalSharpness, desertFactor * normalStrengthFar);

	normal = triplanarNormal(vSamplePointScaled, normal, snowNormalMap, nearScale, normalSharpness, snowFactor * normalStrengthNear);
	normal = triplanarNormal(vSamplePointScaled, normal, snowNormalMap, farScale, normalSharpness, snowFactor * normalStrengthFar);

	normal = triplanarNormal(vSamplePointScaled, normal, steepNormalMap, nearScale, normalSharpness, steepFactor * normalStrengthNear);
	normal = triplanarNormal(vSamplePointScaled, normal, steepNormalMap, farScale, normalSharpness, steepFactor * normalStrengthFar);


	vec3 color = steepFactor * steepColor
	+ beachFactor * beachColor
	+ desertFactor * desertColor
	+ plainFactor * plainColor
	+ snowFactor * snowColor
	+ bottomFactor * bottomColor;

	vec3 normalW = mat3(normalMatrix) * normal;


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