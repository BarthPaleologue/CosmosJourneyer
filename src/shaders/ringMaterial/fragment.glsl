precision lowp float;

varying vec3 vPosition; // position of the vertex in sphere space

#ifdef LOGARITHMICDEPTH
uniform float logarithmicDepthConstant;
varying float vFragmentDepth;
#endif

uniform float seed;
uniform float planetRadius;

uniform float ringStart;
uniform float ringEnd;

#pragma glslify: lerp = require(../utils/vec3Lerp.glsl)

#pragma glslify: fractalSimplex4 = require(../utils/simplex4.glsl)

void main() {
    // la unitPosition ne prend pas en compte la rotation de la planète

    float distanceToPlanet = length(vPosition);
    float normalizedDistance = distanceToPlanet / planetRadius;

    // out if not intersecting with rings
    if(normalizedDistance < ringStart || normalizedDistance > ringEnd) discard;

    // compute the actual density of the rings at the sample point
    vec4 seededSamplePoint = vec4(normalizedDistance, normalizedDistance, normalizedDistance, seed);
    float noiseValue = fractalSimplex4(seededSamplePoint * 10.0, 5, 2.0, 2.0);

    vec3 finalColor = lerp(vec3(0.0), vec3(1.0), noiseValue);
    //vec3 finalColor = vec3(planetRadius);

    gl_FragColor = vec4(finalColor, 1.0); // apply color and lighting
    #ifdef LOGARITHMICDEPTH
    gl_FragDepthEXT = log2(vFragmentDepth) * logarithmicDepthConstant * 0.5;
    #endif
} 