precision lowp float;

varying vec3 vPosition; // position of the vertex in sphere space

#ifdef LOGARITHMICDEPTH
	uniform float logarithmicDepthConstant;
	varying float vFragmentDepth;
#endif

uniform vec3 starColor;
uniform float time;

#pragma glslify: completeNoise = require(../utils/noise.glsl)

#pragma glslify: lerp = require(../utils/vec3Lerp.glsl)

void main() {
	// la unitPosition ne prend pas en compte la rotation de la planète
	vec3 unitPosition = normalize(vPosition);

	unitPosition += vec3(time, -time, time) / 100.0;
	
	float noiseValue = completeNoise(unitPosition * 20.0, 8, 2.0, 2.0);

	vec3 finalColor = starColor;

	finalColor -= vec3(pow(noiseValue, 4.0));

	gl_FragColor = vec4(finalColor, 1.0); // apply color and lighting
	#ifdef LOGARITHMICDEPTH
        gl_FragDepthEXT = log2(vFragmentDepth) * logarithmicDepthConstant * 0.5;
    #endif
} 