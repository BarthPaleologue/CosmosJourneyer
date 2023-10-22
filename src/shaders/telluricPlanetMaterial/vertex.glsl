precision highp float;

attribute vec3 position;
attribute vec3 normal;

#ifdef LOGARITHMICDEPTH
	uniform float logarithmicDepthConstant;
	out float vFragmentDepth;
#endif

uniform mat4 world;
uniform mat4 worldViewProjection;
uniform mat4 normalMatrix;

uniform vec3 planetPosition;

uniform mat4 planetInverseRotationMatrix;

out vec3 vPositionW;
out vec3 vNormalW;
out vec3 vSphereNormalW;

out vec3 vNormal;
out vec3 vPosition;

out vec3 vUnitSamplePoint;
out vec3 vSamplePoint;
out vec3 vSamplePointScaled;

out vec3 vLocalPosition;

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
