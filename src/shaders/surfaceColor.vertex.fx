precision highp float;

// Attributes
attribute vec3 vertex;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

#ifdef LOGARITHMICDEPTH
	uniform float logarithmicDepthConstant;
	varying float vFragmentDepth;
#endif

// Uniforms
uniform mat4 world;
uniform mat4 worldViewProjection;

uniform vec3 v3CameraPos; // camera position in world space
uniform vec3 v3LightPos; // light position in world space

uniform vec3 planetPosition; // nécessaire temporairement le temps de régler le problème des floats
uniform mat4 planetWorldMatrix;

uniform vec4 planetRotationQuaternion;
uniform float planetRadius;

// Varying
varying vec3 vPositionW;
varying vec3 vNormalW;

varying vec3 vNormal;
varying vec3 vPosition;

varying vec3 vUnitSamplePoint;
varying vec3 vSamplePoint;

varying vec2 vUV;

vec3 rotateAround(vec3 vector, vec3 axis, float theta) {
    // rotation using https://www.wikiwand.com/en/Rodrigues%27_rotation_formula
    // Please note that unit vector are required, i did not divide by the norms
    return cos(theta) * vector + cross(axis, vector) * sin(theta) + axis * dot(axis, vector) * (1.0 - cos(theta));
}

vec3 applyQuaternion(vec4 quaternion, vec3 vector) {
    float qx = quaternion.x;
    float qy = quaternion.y;
    float qz = quaternion.z;
    float qw = quaternion.w;
    float x = vector.x;
    float y = vector.y;
    float z = vector.z;
    // apply quaternion to vector
    float ix = qw * x + qy * z - qz * y;
    float iy = qw * y + qz * x - qx * z;
    float iz = qw * z + qx * y - qy * x;
    float iw = -qx * x - qy * y - qz * z;
    // calculate result * inverse quat
    float nX = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    float nY = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    float nZ = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return vec3(nX, nY, nZ);
}

void main() {

    vec4 outPosition = worldViewProjection * vec4(position, 1.0);
    gl_Position = outPosition;
    #ifdef LOGARITHMICDEPTH
    	vFragmentDepth = 1.0 + gl_Position.w;
    	gl_Position.z = log2(max(0.000001, vFragmentDepth)) * logarithmicDepthConstant;
    #endif
    
    vPositionW = vec3(world * vec4(position, 1.0));
    vNormalW = vec3(world * vec4(normal, 0.0));
	
	//vPosition = vec3(inverse(planetWorldMatrix) * vec4(vPositionW, 1.0));
	vPosition = vPositionW - planetPosition;


	vUnitSamplePoint = applyQuaternion(planetRotationQuaternion, normalize(vPosition));
	vSamplePoint = applyQuaternion(planetRotationQuaternion, vPosition);

	vNormal = normal;
    vUV = uv;
}