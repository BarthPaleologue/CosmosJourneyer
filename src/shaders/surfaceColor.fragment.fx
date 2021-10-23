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
uniform float normalSharpness;

uniform float maxElevation;

uniform float snowElevation01;
uniform float snowOffsetAmplitude;
uniform float snowLacunarity;
uniform float snowLatitudePersistence;
uniform float steepSnowDotLimit;

uniform vec3 snowColor; // the color of the snow layer
uniform vec3 steepColor; // the color of steep slopes
uniform vec3 plainColor; // the color of plains at the bottom of moutains
uniform vec3 sandColor; // the color of the sand
vec3 toundraColor = vec3(40.0, 40.0, 40.0) / 255.0;

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

	tNormalX = lerp(tNormalX, tSteepNormalX, 1.0 - steepFactor);
	tNormalY = lerp(tNormalY, tSteepNormalY, 1.0 - steepFactor);
	tNormalZ = lerp(tNormalZ, tSteepNormalZ, 1.0 - steepFactor);

    tNormalX = vec3(normalStrength * tNormalX.xy + surfaceNormal.zy, tNormalX.z * surfaceNormal.x);
    tNormalY = vec3(normalStrength * tNormalY.xy + surfaceNormal.xz, tNormalY.z * surfaceNormal.y);
    tNormalZ = vec3(normalStrength * tNormalZ.xy + surfaceNormal.xy, tNormalZ.z * surfaceNormal.z);

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

vec3 computeColorAndNormal(float elevation01, float waterLevel01, float latitude, float slope, vec3 unitPosition, out vec3 normal) {
	normal = vNormal;

	float snowOffset = (completeNoise(unitPosition * 200.0, 3, 2.0, snowLacunarity) - 0.5) * 2.0;

	if(elevation01 > snowElevation01 * exp(-abs(latitude) * snowLatitudePersistence) + snowOffsetAmplitude * snowOffset) {
		// il fait froid !!!!!!!!
		if(pow(1.0 - slope, 1.0) > steepSnowDotLimit + (completeNoise(unitPosition * 200.0, 3, 2.0, 7.0)-0.5) * 0.5) {
			// neige à plat bien blanche

			normal = triplanarNormal(vPosition, normal, 0.0, 0.0, 0.0, 1.0, 0.0, 0.001, normalSharpness, 0.3);
			normal = triplanarNormal(vPosition, normal, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0003, normalSharpness, 0.3); // plus grand

			return snowColor;
		} else {
			// neige en pente un peu assombrie

			normal = triplanarNormal(vPosition, normal, 0.0, 0.0, 0.0, 0.0, 1.0, 0.001, normalSharpness, 0.3);
			normal = triplanarNormal(vPosition, normal, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0003, normalSharpness, 0.3); // plus grand

			return steepColor;
		}
	} else if(elevation01 > waterLevel01) {

		vec3 openColor = lerp(plainColor, sandColor, pow(completeNoise(unitPosition, 1, 2.0, 2.0), 1.0));

		// entre mer et ciel
		vec3 flatColor = lnear(sandColor, lerp(snowColor, openColor, pow(elevation01, 8.0)), elevation01, waterLevel01, sandSize / maxElevation);

		float sandFactor = getLnearFactor(elevation01, waterLevel01, sandSize / maxElevation);
		float plainFactor = 1.0 - sandFactor;

		float steepFactor = 1.0 - pow(1.0 - slope, steepSharpness); // tricks pour éviter un calcul couteux d'exposant décimal

		sandFactor *= steepFactor;
		plainFactor *= steepFactor;

		normal = triplanarNormal(vPosition, normal, 0.0, sandFactor, plainFactor, 0.0, steepFactor, 0.001, normalSharpness, 0.3);
		normal = triplanarNormal(vPosition, normal, 0.0, sandFactor, plainFactor, 0.0, steepFactor, 0.0003, normalSharpness, 0.3); // plus grand

		return lerp(flatColor, steepColor, pow(1.0 - slope, steepSharpness));
	} else {
		// entre abysse et surface
		vec3 flatColor = lnear(sandColor, vec3(0.5), elevation01, waterLevel01, sandSize / maxElevation);

		float sandFactor = getLnearFactor(elevation01, waterLevel01, sandSize / maxElevation);
		float plainFactor = 1.0 - sandFactor;

		float steepFactor = 1.0 - pow(1.0 - slope, steepSharpness);

		sandFactor *= steepFactor;
		plainFactor *= steepFactor;

		normal = triplanarNormal(vPosition, normal, 0.0, sandFactor, plainFactor, 0.0, steepFactor, 0.001, normalSharpness, 0.3);
		normal = triplanarNormal(vPosition, normal, 0.0, sandFactor, plainFactor, 0.0, steepFactor, 0.0003, normalSharpness, 0.3); // plus grand

		
		return lerp(flatColor, steepColor, pow(slope, steepSharpness));
	}

}

void main() {

	vec3 viewDirectionW = normalize(v3CameraPos - vPositionW); // view direction in world space

	float distance = length(v3CameraPos - vPositionW);

	//float maxElevation = 10300.0; // voir dans builder avec les différents layer pour adapter

	vec3 unitPosition = normalize(vPosition);
	
	float elevation = length(vPosition) - planetRadius;

	float elevation01 = elevation / maxElevation;
	elevation01 = max(0.0, elevation01);

	float waterLevel01 = waterLevel / maxElevation;

	float latitude = unitPosition.y;
	float absLatitude = abs(latitude);

	float temperatureHeightFalloff = 1.0;
	float temperatureLatitudeSharpness = 0.1;
	float temperature = pow(1.0 - absLatitude, temperatureLatitudeSharpness); 
	temperature *= exp(-elevation01 * temperatureHeightFalloff);

	float elevationFromWaterLevel = abs(elevation01 - waterLevel01);

	float moisture01 = completeNoise(unitPosition * 5.0, 3, 2.0, 2.0);

	float slope = 1.0 - dot(unitPosition, vNormal);

	vec3 normal = vNormal;

	vec3 color = computeColorAndNormal(elevation01, waterLevel01, latitude, slope, unitPosition, normal);

	vec3 normalW = normalize(vec3(world * vec4(normal, 0.0)));

	vec3 lightRay = normalize(v3LightPos - vPositionW); // light ray direction in world space
	vec3 parallelLightRay = normalize(v3LightPos - planetPosition); // light ray direction in world space
	
	float ndl = max(0., dot(normalW, parallelLightRay)); // dimming factor due to light inclination relative to vertex normal in world space

	// specular
	vec3 angleW = normalize(viewDirectionW + lightRay);
    float specComp = max(0., dot(normalW, angleW));
    specComp = pow(specComp, 64.0);

	vec3 screenColor = color.rgb * ndl * (1.0 + vec3(specComp) / 10.0);

	gl_FragColor = vec4(screenColor, 1.0); // apply color and lighting	
} 