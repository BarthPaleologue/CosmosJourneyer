precision highp float;

// Attributes
attribute vec3 vertex;
attribute vec3 position;
attribute vec3 normal;

// Uniforms
uniform mat4 world;
uniform mat4 worldViewProjection;

uniform vec3 v3CameraPos;		// The camera's current position	

// Varying
varying vec3 vPositionW;
varying vec3 vNormalW;

varying vec3 vNormal;
varying vec3 vPosition;



void main(void) {

    vec4 outPosition = worldViewProjection * vec4(position, 1.0);
    gl_Position = outPosition;
    
    vPositionW = vec3(world * vec4(position, 1.0));
    vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
	
	vPosition = position;
	vNormal = normal;
}
    