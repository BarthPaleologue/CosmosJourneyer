precision lowp float;

varying vec3 vPosition; // position of the vertex in sphere space
varying vec3 vUnitSamplePoint;

#ifdef LOGARITHMICDEPTH
	uniform float logarithmicDepthConstant;
	varying float vFragmentDepth;
#endif

uniform vec3 starColor;
uniform float time;

uniform float seed;

#pragma glslify: completeNoise = require(../utils/noise.glsl)

#pragma glslify: lerp = require(../utils/vec3Lerp.glsl)

#pragma glslify: rotateAround = require(../utils/rotateAround.glsl)

#pragma glslify: fractalSimplex4 = require(../utils/simplex4.glsl, tanh=tanh)

void main() {
	// la unitPosition ne prend pas en compte la rotation de la planète

	float plasmaSpeed = 0.005;
	vec4 seededSamplePoint = vec4(rotateAround(vUnitSamplePoint, vec3(0.0, 1.0, 0.0), time * plasmaSpeed), seed / 1e5);

	float noiseValue = fractalSimplex4(seededSamplePoint * 5.0, 8, 2.0, 2.0);

	vec3 finalColor = starColor;

	finalColor -= vec3(pow(noiseValue, 4.0));

	gl_FragColor = vec4(finalColor, 1.0); // apply color and lighting
	#ifdef LOGARITHMICDEPTH
        gl_FragDepthEXT = log2(vFragmentDepth) * logarithmicDepthConstant * 0.5;
    #endif
} 