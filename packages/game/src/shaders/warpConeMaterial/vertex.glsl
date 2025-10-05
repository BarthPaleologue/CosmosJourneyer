precision lowp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 worldViewProjection;

uniform float time;

uniform sampler2D warpNoise;

varying vec3 vPosition;
varying vec2 vUV;

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

    float noise = perlin(uv + vec2(0.0, 0.1 * time), 4);

    vec3 shiftedPosition = position + vec3(noise * 30.0, 0.0, 0.0);

    vec4 outPosition = worldViewProjection * vec4(shiftedPosition, 1.0);
    gl_Position = outPosition;
    vPosition = position;
    vUV = uv;
}