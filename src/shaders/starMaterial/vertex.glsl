precision highp float;

attribute vec3 position;

uniform mat4 world;
uniform mat4 worldViewProjection;

varying vec3 vPositionW;
varying vec3 vPosition;
varying vec3 vUnitSamplePoint;

uniform vec4 starInverseRotationQuaternion;
uniform vec3 starPosition;

#pragma glslify: applyQuaternion = require(../utils/applyQuaternion.glsl)

void main() {

    vec4 outPosition = worldViewProjection * vec4(position, 1.0);
    gl_Position = outPosition;

    vPositionW = vec3(world * vec4(position, 1.0));

    vPosition = vPositionW - starPosition;

    vUnitSamplePoint = applyQuaternion(starInverseRotationQuaternion, normalize(vPosition));
}