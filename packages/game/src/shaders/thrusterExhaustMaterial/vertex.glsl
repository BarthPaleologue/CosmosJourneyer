precision highp float;

attribute vec3 position;

uniform mat4 world;
uniform mat4 worldViewProjection;

varying vec3 vPositionW;

void main() {
    vec4 positionW = world * vec4(position, 1.0);
    vPositionW = positionW.xyz;
    gl_Position = worldViewProjection * vec4(position, 1.0);
}
