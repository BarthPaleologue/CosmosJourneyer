precision highp float;

varying vec2 vUV;

#include "../../utils/noise.glsl";

#include "../../utils/toSphere.glsl";

void main() {
    vec3 sphere = toSphere(vUV);

    vec3 domainWarping = 0.5 * vec3(
    completeNoise(sphere + vec3(23.0, 57.0, -18.0), 5, 2.0, 2.0),
    completeNoise(sphere + vec3(57.0, -18.0, 23.0), 5, 2.0, 2.0),
    completeNoise(sphere + vec3(-18.0, 23.0, 57.0), 5, 2.0, 2.0)
    ) - 0.5;

    float noise = completeNoise(domainWarping + sphere * 10.0, 5, 2.0, 2.0);

    gl_FragColor = vec4(noise, 0.0, 0.0, 0.0);
}