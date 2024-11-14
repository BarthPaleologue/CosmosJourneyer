precision lowp float;

varying vec3 vPosition;
varying vec2 vUV;

uniform float time;

uniform sampler2D warpNoise;

#include "../utils/smoothSharpener.glsl";

float perlin(vec2 uv, int nbOctaves) {
    float value = 0.0;
    float frequency = 1.0;
    float decay = 1.0;
    float totalAmplitude = 0.0;

    for (int i = 0; i < nbOctaves; i++) {
        totalAmplitude += decay;
        value += texture2D(warpNoise, uv * frequency).r * decay;
        frequency *= 2.0;
        decay *= 0.5;
    }

    return value / totalAmplitude;
}

void main() {
    vec2 samplePoint = 3.0 * vUV + vec2(0.0, time * 1.2);
    vec2 densitySamplePoint = samplePoint / 3.0;
    densitySamplePoint.y /= 2.0;

    vec2 samplePoint2 = 4.0 * vUV.yx + vec2(time * 1.5, 0.0);
    vec2 densitySamplePoint2 = samplePoint2 / 4.0;
    densitySamplePoint2.x /= 2.0;

    float noise = perlin(samplePoint, 4);
    noise = pow(noise, 4.0);

    float density1 = perlin(densitySamplePoint, 1);
    density1 = smoothSharpener(density1, 8.0);

    noise *= density1;

    float noise2 = perlin(samplePoint2, 4);
    noise2 = pow(noise2, 6.0);
    noise2 = smoothstep(0.1, 1.0, noise2);

    float density2 = perlin(densitySamplePoint2, 1);
    density2 = smoothSharpener(density2, 8.0);

    noise2 *= density2;

    float brightEnd = 0.6 * smoothstep(0.2, 1.0, vUV.y);

    float rays = pow(sin(vUV.x * 3.1415 * 4.0 + time), 4.0);
    rays *= 0.2 + sin(time * 2.0) * 0.1;

    vec3 finalColor = noise * vec3(1.2, 1.2, 2.0) * 3.0;

    finalColor += noise2 * vec3(0.9, 1.0, 0.9);

    finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), brightEnd);

    finalColor += 0.5 * vec3(1.0, 0.9, 0.9) * rays;

    gl_FragColor = vec4(finalColor, 1.0); // apply color and lighting
} 