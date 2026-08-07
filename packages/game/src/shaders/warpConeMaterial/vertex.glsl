precision lowp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 world;
uniform mat4 viewProjection;

uniform float time;

uniform sampler2D warpNoise;

varying vec3 vPosition;
varying vec2 vUV;

const float NOISE_LONGITUDINAL_SCALE = 1.0 / 3.0;

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

    vec2 noiseUv = vec2(uv.x, (uv.y + 0.1 * time) * NOISE_LONGITUDINAL_SCALE);
    float noise = perlin(noiseUv, 4);

    vec3 shiftedPosition = position + vec3(noise * 30.0, 0.0, 0.0);

    vec4 positionW = world * vec4(shiftedPosition, 1.0);
    gl_Position = viewProjection * positionW;
    vPosition = position;
    vUV = uv;
}
