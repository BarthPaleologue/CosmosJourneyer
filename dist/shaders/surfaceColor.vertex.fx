precision highp float;

// Attributes
attribute vec3 vertex;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 world;
uniform mat4 worldViewProjection;

uniform vec3 v3CameraPos; // camera position in world space
uniform vec3 v3LightPos; // light position in world space

uniform float planetRadius; // planet radius
uniform float iceCapThreshold; // controls snow minimum spawn altitude
uniform float steepSnowDotLimit; // controls snow maximum spawn steepness
uniform float waterLevel; // controls sand layer
uniform float sandSize;

uniform vec4 snowColor; // the color of the snow layer
uniform vec4 steepColor; // the color of steep slopes
uniform vec4 plainColor; // the color of plains at the bottom of moutains
uniform vec4 sandColor; // the color of the sand


// Varying
varying vec3 vPositionW;
varying vec3 vNormalW;

varying vec3 vNormal;
varying vec3 vPosition;

varying vec2 vUV;

void main(void) {

    vec4 outPosition = worldViewProjection * vec4(position, 1.0);
    gl_Position = outPosition;
    
    vPositionW = vec3(world * vec4(position, 1.0));
    vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
	
	vPosition = position;
	vNormal = normal;
    vUV = uv;
}