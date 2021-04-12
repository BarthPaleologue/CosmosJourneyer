precision highp float;

// Lights
varying vec3 vPositionW;
varying vec3 vNormalW;

varying vec2 vUv; 
varying vec3 wPosition; 
varying vec4 c0; 
varying vec4 c1; 
varying vec3 t0; 

// Refs
uniform vec3 v3CameraPos;
uniform vec3 lightDirection;
uniform sampler2D textureSampler;

varying vec3 color;
varying vec3 secondaryColor;

uniform vec3 v3LightPos;	
uniform float g;	
uniform float g2;	
uniform float fExposure;	
varying vec3 v3Direction;


void main(void) {
    float fCos = dot(v3LightPos, v3Direction) / length(v3Direction);	
	float fRayleighPhase = 0.75 * (1.0 + fCos*fCos);	
	float fMiePhase = 1.5 * ((1.0 - g2) / (2.0 + g2)) * (1.0 + fCos*fCos) / pow(1.0 + g2 - 2.0*g*fCos, 1.5);	
	gl_FragColor.rgb = 1.0 - exp( -fExposure * (fRayleighPhase * color + fMiePhase * secondaryColor) );
	gl_FragColor.a = 1.0; 

    //vec3 color = vec3(1., 1., 1.);
    //vec3 viewDirectionW = normalize(v3CameraPos - vPositionW);

    // Fresnel
	//float fresnelTerm = dot(viewDirectionW, vNormalW);
	//fresnelTerm = clamp(1.0 - fresnelTerm, 0., 1.);

    //gl_FragColor = vec4(color * fresnelTerm, 1.);
}