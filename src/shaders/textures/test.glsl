precision highp float;

varying vec2 vUV;

void main() {
    gl_FragColor = vec4(vUV.x, vUV.y, 0.0, 1.0);
}