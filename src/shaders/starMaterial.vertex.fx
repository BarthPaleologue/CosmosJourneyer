precision lowp float;

// Attributes
attribute vec3 position;

// Uniforms
uniform mat4 world;
uniform mat4 worldViewProjection;

uniform mat4 planetWorldMatrix;

// Varying
varying vec3 vPositionW;

varying vec3 vPosition;

void main() {

    vec4 outPosition = worldViewProjection * vec4(position, 1.0);
    gl_Position = outPosition;
    
    vPositionW = vec3(world * vec4(position, 1.0));
	
	vPosition = vec3(inverse(planetWorldMatrix) * vec4(vPositionW, 1.0));
}