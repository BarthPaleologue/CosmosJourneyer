precision highp float;

varying vec3 vPosition;// position of the vertex varyingsphere space
varying vec3 vUnitSamplePoint;

uniform vec3 starColor;
uniform float time;

uniform float seed;

#include "../utils/rotateAround.glsl";

#include "../utils/simplex4.glsl";

void main() {
    float plasmaSpeed = 0.005;
    vec4 seededSamplePoint = vec4(rotateAround(vUnitSamplePoint, vec3(0.0, 1.0, 0.0), time * plasmaSpeed), mod(seed, 1e3));

    float noiseValue = fractalSimplex4(seededSamplePoint * 5.0, 8, 2.0, 2.0);

    vec3 finalColor = starColor;

    finalColor -= vec3(pow(noiseValue, 4.0));

    gl_FragColor = vec4(finalColor, 1.0);// apply color and lighting
} 