precision lowp float;

attribute vec3 position;

#ifdef LOGARITHMICDEPTH
	uniform float logarithmicDepthConstant;
	out float vFragmentDepth;
#endif

uniform mat4 world;
uniform mat4 worldViewProjection;

out vec3 vPositionW;
out vec3 vPosition;
out vec3 vUnitSamplePoint;

uniform vec4 starInverseRotationQuaternion;
uniform vec3 starPosition;

#pragma glslify: applyQuaternion = require(../utils/applyQuaternion.glsl)

void main() {

    vec4 outPosition = worldViewProjection * vec4(position, 1.0);
    gl_Position = outPosition;
    #ifdef LOGARITHMICDEPTH
    vFragmentDepth = 1.0 + gl_Position.w;
    gl_Position.z = log2(max(0.000001, vFragmentDepth)) * logarithmicDepthConstant;
    #endif

    vPositionW = vec3(world * vec4(position, 1.0));

    vPosition = vPositionW - starPosition;

    vUnitSamplePoint = applyQuaternion(starInverseRotationQuaternion, normalize(vPosition));
}