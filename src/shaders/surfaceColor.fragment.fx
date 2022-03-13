precision lowp float;

// Lights
varying vec3 vPositionW;
varying vec3 vNormalW;

// Refs

uniform mat4 world;

uniform vec3 playerPosition; // camera position in world space
uniform float cameraNear;
uniform float cameraFar;
uniform vec3 sunPosition; // light position in world space
uniform vec3 planetPosition;
uniform mat4 view;
uniform mat4 projection;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler; // evaluate sceneDepth

uniform sampler2D bottomNormalMap;
uniform sampler2D plainNormalMap;
uniform sampler2D sandNormalMap;

uniform sampler2D snowNormalMap;
uniform sampler2D snowNormalMap2;

uniform sampler2D steepNormalMap;

uniform vec3 seed;

uniform float planetRadius; // planet radius
uniform float waterLevel; // controls sand layer
uniform float sandSize;

uniform float steepSharpness; // sharpness of demaracation between steepColor and normal colors
uniform float normalSharpness;

uniform float maxElevation;

uniform vec3 snowColor; // the color of the snow layer
uniform vec3 steepColor; // the color of steep slopes
uniform vec3 plainColor; // the color of plains at the bottom of moutains
uniform vec3 sandColor; // the color of the sand
vec3 toundraColor = vec3(40.0, 40.0, 40.0) / 255.0;

uniform float minTemperature;
uniform float maxTemperature;

uniform float waterAmount;

varying vec3 vPosition; // position of the vertex in sphere space
varying vec3 vNormal; // normal of the vertex in sphere space
varying vec2 vUV; // 

// Noise functions to spice things up a little bit
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

float remap(float value, float low1, float high1, float low2, float high2) {
    return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
}

vec3 lerp(vec3 vector1, vec3 vector2, float x) {
	return x * vector1 + (1.0 - x) * vector2;
}

vec2 lerp(vec2 vector1, vec2 vector2, float x) {
	return x * vector1 + (1.0 - x) * vector2;
}

float lerp(float value1, float value2, float x) {
	return x * value1 + (1.0 - x) * value2;
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

	vec3 tSnowNormalX = lerp(
		texture2D(snowNormalMap, position.zy * scale).rgb,
		texture2D(snowNormalMap2, position.zy * scale).rgb,
		completeNoise(position, 3, 2.0, 2.0)
	);
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
	if(totalAmplitude > 0.0) tNormalX /= totalAmplitude;

	vec3 tNormalY = bottomFactor * tBottomNormalY;
	tNormalY += sandFactor * tSandNormalY;
	tNormalY += plainFactor * tPlainNormalY;
	tNormalY += snowFactor * tSnowNormalY;
	if(totalAmplitude > 0.0) tNormalY /= totalAmplitude;

	vec3 tNormalZ = bottomFactor * tBottomNormalZ;
	tNormalZ += sandFactor * tSandNormalZ;
	tNormalZ += plainFactor * tPlainNormalZ;
	tNormalZ += snowFactor * tSnowNormalZ;
	if(totalAmplitude > 0.0) tNormalZ /= totalAmplitude;

	tNormalX = lerp(tNormalX, tSteepNormalX, 1.0-steepFactor) * normalStrength;
	tNormalY = lerp(tNormalY, tSteepNormalY, 1.0-steepFactor) * normalStrength;
	tNormalZ = lerp(tNormalZ, tSteepNormalZ, 1.0-steepFactor) * normalStrength;

    tNormalX = vec3(tNormalX.xy + surfaceNormal.zy, tNormalX.z * surfaceNormal.x);
    tNormalY = vec3(tNormalY.xy + surfaceNormal.xz, tNormalY.z * surfaceNormal.y);
    tNormalZ = vec3(tNormalZ.xy + surfaceNormal.xy, tNormalZ.z * surfaceNormal.z);

    vec3 blendWeight = pow(abs(surfaceNormal), vec3(sharpness));
    blendWeight /= dot(blendWeight, vec3(1.0));

    return normalize(tNormalX.zyx * blendWeight.x + tNormalY.xzy * blendWeight.y + tNormalZ.xyz * blendWeight.z);
}

bool near(float value, float reference, float range) {
	return abs(reference - value) < range; 
}

float nearFloat(float value, float reference, float range) {
	if(near(value, reference, range)) {
		return 1.0;
	} else {
		return 0.0;
	}
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



vec3 computeColorAndNormal(
	float elevation01, float waterLevel01, float slope, 
	out vec3 normal, float temperature01, float moisture01, 
	float waterMeltingPoint01, float absLatitude01) {
	
	normal = vNormal;

	float plainFactor = 0.0,
	sandFactor = 0.0,
	bottomFactor = 0.0,
	snowFactor = 0.0, 
	steepFactor = 0.0;

	vec3 outColor;

	if(elevation01 > waterLevel01) {

		// séparation biome désert biome plaine
		float openFactor = tanherpFactor(moisture01, 32.0);
		vec3 vPlainColor = tanherp(plainColor, 0.7 * plainColor, noise(vPosition/10000.0), 3.0);
		vec3 flatColor = lerp(vPlainColor, sandColor, openFactor);

		// séparation biome sélectionné avec biome neige
		// waterMeltingPoint01 * waterAmount : il est plus difficile de former de la neige quand y a moins d'eau
		float snowColorFactor = tanh01((waterMeltingPoint01 * min(waterAmount, 1.0) - temperature01) * 64.0);
		flatColor = lerp(snowColor, flatColor, snowColorFactor);
		snowFactor = snowColorFactor;

		// séparation biome sélectionné avec biome plage
		flatColor = lnear(sandColor, flatColor, elevation01, waterLevel01, sandSize / maxElevation);

		sandFactor = max(getLnearFactor(elevation01, waterLevel01, sandSize / maxElevation), 1.0 - openFactor);
		plainFactor = 1.0 - sandFactor;
		plainFactor *= 1.0 - snowFactor;

		// détermination de la couleur due à la pente
		float steepDominance = 6.0;
		steepFactor = tanherpFactor(1.0 - pow(1.0-slope, steepDominance), steepSharpness); // tricks pour éviter un calcul couteux d'exposant décimal
		steepFactor *= 1.0 - snowFactor;

		sandFactor *= 1.0 - steepFactor;
		plainFactor *= 1.0 - steepFactor;

		steepFactor *= steepFactor;

		outColor = lerp(flatColor, steepColor, 1.0 - steepFactor);
	} else {
		// entre abysse et surface
		vec3 flatColor = lnear(sandColor, vec3(0.5), elevation01, waterLevel01, sandSize / maxElevation);

		sandFactor = getLnearFactor(elevation01, waterLevel01, sandSize / maxElevation);
		bottomFactor = 1.0 - sandFactor;

		float steepDominance = 6.0;
		steepFactor = tanherpFactor(1.0 - pow(1.0-slope, steepDominance), steepSharpness); // tricks pour éviter un calcul couteux d'exposant décimal

		sandFactor *= 1.0 - steepFactor;
		bottomFactor *= 1.0 - steepFactor;

		steepFactor *= steepFactor;

		outColor = lerp(flatColor, steepColor, 1.0 - steepFactor);
	}

	// TODO: briser la répétition avec du simplex
	// TODO: interpoler entre les distances
	// genre celui là on l'appelle farNormal
	normal = triplanarNormal(vPosition, normal, bottomFactor, sandFactor, plainFactor, snowFactor, steepFactor, 0.001, normalSharpness, 0.5);
	//normal = triplanarNormal(vPosition, normal, bottomFactor, sandFactor, plainFactor, snowFactor, steepFactor, 0.0003, normalSharpness, 0.2); // plus grand
	// et celui là on l'appelle nearNormal
	normal = triplanarNormal(vPosition, normal, bottomFactor, sandFactor, plainFactor, snowFactor, steepFactor, 0.00001, normalSharpness, 0.15); // plus grand
    // et avec la distance à la planète / surface on fait une interpolation entre les deux ! (on peut même clamp un peu)

	return outColor;
}

// https://www.omnicalculator.com/chemistry/boiling-point
// https://www.wikiwand.com/en/Boiling_point#/Saturation_temperature_and_pressure
// https://www.desmos.com/calculator/ctxerbh48s
float waterBoilingPointCelsius(float pressure) {
	float P1 = 1.0;
	float P2 = pressure;
	float T1 = 100.0 + 273.15;
	float DH = 40660.0;
	float R = 8.314;
	if(P2 > 0.0) {
		return (1.0 / ((1.0 / T1) + log(P1 / P2) * (R / DH))) - 273.15;
	} else {
		return -273.15;
	}
}

void main() {
	vec3 viewRayW = normalize(playerPosition - vPositionW); // view direction in world space
	vec3 parallelLightRayW = normalize(sunPosition - planetPosition); // light ray direction in world space
	vec3 lightRayW = normalize(sunPosition - vPositionW); // light ray direction in world space

	vec3 sphereNormalW = normalize(vec3(world * vec4(normalize(vPosition), 0.0)));
	float ndl = max(0.07, dot(sphereNormalW, parallelLightRayW));

	// la unitPosition ne prend pas en compte la rotation de la planète
	vec3 unitPosition = normalize(vPosition);
	vec3 seededSamplePoint = normalize(normalize(unitPosition) + seed);//normalize(unitPosition + normalize(seed));
	
	float latitude = unitPosition.y;
	float absLatitude01 = abs(latitude);
	
	float elevation = length(vPosition) - planetRadius;

	float elevation01 = elevation / maxElevation;
	float waterLevel01 = waterLevel / maxElevation;

	float slope = 1.0 - dot(unitPosition, vNormal);

	/// Analyse Physique de la planète

	float dayDuration = 1.0;
	
	// pressions
	float pressure = 1.0;
	float waterSublimationPression = 0.006; //https://www.wikiwand.com/en/Sublimation_(phase_transition)#/Water
	
	// Températures
	
	float waterMeltingPoint = 0.0; // fairly good approximation
	float waterMeltingPoint01 = (waterMeltingPoint - minTemperature) / (maxTemperature - minTemperature);
	float waterBoilingPoint01 = (waterBoilingPointCelsius(pressure) - minTemperature) / (maxTemperature - minTemperature);

	//https://qph.fs.quoracdn.net/main-qimg-6a0fa3c05fb4db3d7d081680aec4b541
	float co2SublimationTemperature = 0.0; // https://www.wikiwand.com/en/Sublimation_(phase_transition)#/CO2
	// todo trouver l'équation de ses morts
	float co2SublimationTemperature01 = (co2SublimationTemperature - minTemperature) / (maxTemperature - minTemperature);

	float temperatureHeightFalloff = 3.0;
	float temperatureLatitudeFalloff = 1.0;
	float temperatureRotationFactor = tanh(dayDuration * 0.2);
	// https://www.researchgate.net/profile/Anders-Levermann/publication/274494740/figure/fig3/AS:391827732615174@1470430419170/a-Surface-air-temperature-as-a-function-of-latitude-for-data-averaged-over-1961-90-for.png
	// https://www.desmos.com/calculator/apezlfvwic
	float temperature01 = -pow(temperatureLatitudeFalloff * absLatitude01, 3.0) + 1.0; // la température diminue vers les pôles
	temperature01 *= exp(-elevation01 * temperatureHeightFalloff); // la température diminue exponentiellement avec l'altitude
	temperature01 += (completeNoise(unitPosition * 300.0, 5, 1.7, 2.5) - 0.5) / 4.0; // on ajoute des fluctuations locales
	temperature01 *= (ndl * temperatureRotationFactor) + 1.0 - temperatureRotationFactor; // la température diminue la nuit
	temperature01 = clamp(temperature01, 0.0, 1.0); // on reste dans la range [0, 1]

	float temperature = lerp(maxTemperature, minTemperature, temperature01);

	// moisture
	float moisture01 = 0.0; // 0.0 = sec, 1.0 = humid : sec par défaut
	if(waterMeltingPoint01 < 1.0) {
		// if there is liquid water on the surface
		moisture01 += completeNoise(seededSamplePoint * 2.0, 5, 2.0, 2.0) * sqrt(1.0-waterMeltingPoint01) * waterBoilingPoint01;
	}
	moisture01 = clamp(moisture01, 0.0, 1.0);

	// calcul de la couleur et de la normale
	vec3 normal = vNormal;
	vec3 color = computeColorAndNormal(elevation01, waterLevel01, slope, normal, temperature01, moisture01, waterMeltingPoint01, absLatitude01);
	vec3 normalW = normalize(vec3(world * vec4(normal, 0.0)));

	float ndl2 = max(0.1, dot(normalW, parallelLightRayW)); // dimming factor due to light inclination relative to vertex normal in world space

	// specular
	vec3 angleW = normalize(viewRayW + lightRayW);
    float specComp = max(0., dot(normalW, angleW));
    specComp = pow(specComp, 32.0);

	// suppresion du reflet partout hors la neige
	specComp *= (color.r + color.g + color.b) / 3.0;
	specComp /= 2.0;

	vec3 screenColor = color.rgb * (ndl2*ndl + specComp);

	int colorMode = 0;
	if(colorMode == 1) screenColor = lerp(vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), moisture01);
	if(colorMode == 2) screenColor = lerp(vec3(1.0, 0.0, 0.0), vec3(0.7, 0.7, 1.0), temperature01);
	if(colorMode == 3) screenColor = normal*0.5 + 0.5;
	if(colorMode == 4) screenColor = vec3(elevation01);
	if(colorMode == 5) screenColor = vec3(1.0 - dot(normal, normalize(vPosition)));

	gl_FragColor = vec4(screenColor, 1.0); // apply color and lighting	
} 