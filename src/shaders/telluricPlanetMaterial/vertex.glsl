precision highp float;

attribute vec3 vertex;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

#ifdef LOGARITHMICDEPTH
	uniform float logarithmicDepthConstant;
	varying float vFragmentDepth;
#endif

uniform mat4 world;
uniform mat4 worldViewProjection;
uniform mat4 normalMatrix;

uniform vec3 planetPosition; // nécessaire temporairement le temps de régler le problème des floats

uniform vec4 planetInverseRotationQuaternion;

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec3 vSphereNormalW;

varying vec3 vNormal;
varying vec3 vPosition;

varying vec3 vUnitSamplePoint;
varying vec3 vSamplePoint;

varying vec3 vLocalPosition;

#pragma glslify: applyQuaternion = require(../utils/applyQuaternion.glsl)

void main() {

    vec4 outPosition = worldViewProjection * vec4(position, 1.0);
    gl_Position = outPosition;
    #ifdef LOGARITHMICDEPTH
    	vFragmentDepth = 1.0 + gl_Position.w;
    	gl_Position.z = log2(max(0.000001, vFragmentDepth)) * logarithmicDepthConstant;
    #endif
    
    vPositionW = vec3(world * vec4(position, 1.0));
    vNormalW = mat3(normalMatrix) * normal;

	vPosition = vPositionW - planetPosition;
	vLocalPosition = position;

	vUnitSamplePoint = applyQuaternion(planetInverseRotationQuaternion, normalize(vPosition));
    vSphereNormalW = mat3(normalMatrix) * vUnitSamplePoint;
	vSamplePoint = applyQuaternion(planetInverseRotationQuaternion, vPosition);

	vNormal = normal;
}