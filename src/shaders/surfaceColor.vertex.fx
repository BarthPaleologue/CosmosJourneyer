precision lowp float;

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

// Varying
varying vec3 vPositionW;
varying vec3 vNormalW;

varying vec3 vNormal;
varying vec3 vPosition;

varying vec2 vUV;

void main() {

    vec4 outPosition = worldViewProjection * vec4(position, 1.0);
    gl_Position = outPosition;
    #ifdef LOGARITHMICDEPTH
    	vFragmentDepth = 1.0 + gl_Position.w;
    	gl_Position.z = log2(max(0.000001, vFragmentDepth)) * logarithmicDepthConstant;
    #endif
    
    vPositionW = vec3(world * vec4(position, 1.0));
    vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
	
	vPosition = vec3(inverse(planetWorldMatrix) * vec4(vPositionW, 1.0));
	vNormal = normal;
    vUV = uv;
}