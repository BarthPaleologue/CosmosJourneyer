precision highp float;

varying vec2 vUV;

uniform float seed;
uniform float frequency;
uniform float ringStart;
uniform float ringEnd;

#include "../utils/noise1D.glsl";

#include "../utils/remap.glsl";

void main() {
    float normalizedDistance = remap(vUV.x, 0.0, 1.0, ringStart, ringEnd);

    float macroRingDensity = completeNoise(fract(seed) + normalizedDistance * frequency / 10.0, 1, 2.0, 2.0);
    float ringDensity = completeNoise(fract(seed) + normalizedDistance * frequency, 5, 2.0, 2.0);
    ringDensity = mix(ringDensity, macroRingDensity, 0.5);
    ringDensity *= smoothstep(ringStart, ringStart + 0.03, normalizedDistance);
    ringDensity *= smoothstep(ringEnd, ringEnd - 0.03, normalizedDistance);

    ringDensity *= ringDensity;

    gl_FragColor = vec4(ringDensity, 0.0, 0.0, 0.0);
}