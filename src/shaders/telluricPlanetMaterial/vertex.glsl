precision highp float;

attribute vec3 position;
attribute vec3 normal;

#ifdef LOGARITHMICDEPTH
	uniform float logarithmicDepthConstant;
	varying float vFragmentDepth;
#endif

uniform mat4 world;
uniform mat4 worldViewProjection;
uniform mat4 normalMatrix;

uniform vec3 planetPosition;

uniform mat4 planetInverseRotationMatrix;

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec3 vSphereNormalW;

varying vec3 vNormal;
varying vec3 vPosition;

varying vec3 vUnitSamplePoint;
varying vec3 vSamplePoint;
varying vec3 vSamplePointScaled;

varying vec3 vLocalPosition;

void main() {

    vec4 outPosition = worldViewProjection * vec4(position, 1.0);
    gl_Position = outPosition;
    #ifdef LOGARITHMICDEPTH
    	vFragmentDepth = 1.0 + gl_Position.w;
    	gl_Position.z = log2(max(0.000001, vFragmentDepth)) * logarithmicDepthConstant;
    #endif
    
    vPositionW = vec3(world * vec4(position, 1.0));
    vNormalW = normalize(mat3(normalMatrix) * normal);

	vPosition = vPositionW - planetPosition;
	vLocalPosition = position;

	vUnitSamplePoint = mat3(planetInverseRotationMatrix) * normalize(vPosition);
	vSamplePointScaled = mat3(planetInverseRotationMatrix) * vPosition / 1000e3;
    vSphereNormalW = mat3(normalMatrix) * vUnitSamplePoint;
	vSamplePoint = mat3(planetInverseRotationMatrix) * vPosition;

	vNormal = normal;
}
