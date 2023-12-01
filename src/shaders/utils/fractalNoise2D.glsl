float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return 0.5 * (1.0 + res*res);
}

float completeNoise(vec2 p, int nbOctaves, float decay, float lacunarity) {
    float totalAmplitude = 0.0;
    float value = 0.0;
    for(int i = 0; i < nbOctaves; ++i) {
        totalAmplitude += 1.0 / pow(decay, float(i));
        vec2 samplePoint = p * pow(lacunarity, float(i));
        value += noise(samplePoint) / pow(decay, float(i));
    }
    return value / totalAmplitude;
}