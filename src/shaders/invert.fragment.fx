precision highp float;

uniform sampler2D textureSampler;

varying vec2 vUV;


void main() {
    vec4 colorSample = texture2D(textureSampler, vUV);

    gl_FragColor = vec4(1.0 - colorSample.rgb, 1.0);

}