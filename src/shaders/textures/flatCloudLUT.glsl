precision highp float;

varying vec2 vUV;

uniform float worleyFrequency;
uniform float detailFrequency;

#include "../utils/toSphere.glsl";

#include "../utils/worley.glsl";

#include "../utils/noise.glsl";

void main() {
    vec3 sphere = toSphere(vUV);

    float worley = completeWorley(sphere * worleyFrequency, 1, 2.0, 2.0);
    float detailNoise = completeNoise(sphere * detailFrequency, 5, 2.0, 2.0);

    gl_FragColor = vec4(vec3(worley, detailNoise, 0.0), 1.0);
}