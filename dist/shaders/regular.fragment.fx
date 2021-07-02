precision highp float;

varying vec2 vUV;

uniform sampler2D textureSampler;

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);

    gl_FragColor = vec4(vec3(1.0), 1.0);
}