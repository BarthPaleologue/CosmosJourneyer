precision highp float;

// Lights
varying vec3 vPositionW;
varying vec3 vNormalW;

// Refs

uniform mat4 world;

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

varying vec3 vPosition; // position of the vertex in sphere space
varying vec3 vNormal; // normal of the vertex in sphere space

// Noise functions to spice things up a little bit
#define M_PI 3.14159265358979323846

float rand(vec2 co){return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);}
float rand (vec2 co, float l) {return rand(vec2(rand(co), l));}
float rand (vec2 co, float l, float t) {return rand(vec2(rand(co, l), t));}

float perlin(vec2 p, float dim, float time) {
	vec2 pos = floor(p * dim);
	vec2 posx = pos + vec2(1.0, 0.0);
	vec2 posy = pos + vec2(0.0, 1.0);
	vec2 posxy = pos + vec2(1.0);
	
	float c = rand(pos, dim, time);
	float cx = rand(posx, dim, time);
	float cy = rand(posy, dim, time);
	float cxy = rand(posxy, dim, time);
	
	vec2 d = fract(p * dim);
	d = -0.5 * cos(d * M_PI) + 0.5;
	
	float ccx = mix(c, cx, d.x);
	float cycxy = mix(cy, cxy, d.x);
	float center = mix(ccx, cycxy, d.y);
	
	return center * 2.0 - 1.0;
}

void main(void) {

	vec3 viewDirectionW = normalize(v3CameraPos - vPositionW); // view direction in world space

	vec3 normVPos = normalize(vPosition); // normalized vertex normal in sphere space
	vec3 normVNorm = normalize(vNormal); // normalized vertex position in sphere space

	vec3 lightRay = normalize(v3LightPos - vPositionW); // light ray direction in world space
	
	vec4 color = vec4(viewDirectionW, 1.); // color of the pixel (default doesn't matter)

	float ndl = max(0., dot(vNormalW, lightRay)); // dimming factor due to light inclination relative to vertex normal in world space

	// specular
	vec3 angleW = normalize(viewDirectionW + lightRay);
    float specComp = max(0., dot(vNormalW, angleW));
    specComp = pow(specComp, max(1., 64.)) * 2.;



	float d = dot(normVPos, normVNorm); // represents the steepness of the slope at a given vertex

	if (length(vPosition) > (planetRadius*(1. + (iceCapThreshold / 100.) - pow(pow(normVPos.y, 8.), 2.)))) {
        // if mountains region (you need to be higher at the equator)
        if (d > steepSnowDotLimit) color = snowColor + vec4(perlin(vPosition.xy, 2., 0.0))/10.; // apply snow color
        else color = color = steepColor; // apply steep color
    } else {
        // if lower region
        if (d < 0.94) color = steepColor; // apply steep color
        else {
			if(length(vPosition) > (1. + sandSize/1000.) * (planetRadius + waterLevel / 2.)) {
				// if above water level
				color = plainColor; // it's a plain
			} else if(length (vPosition) > (1. - sandSize/1000.) * (planetRadius + waterLevel / 2.)) {
				// if it's just above water level
				color = sandColor;
			} else {
				// if it's SOOOUS L'OCEAAAAAAN
				color = steepColor; // placeholder for sea bottom color eventually
			}
        }
    }
	gl_FragColor = vec4(color.rgb * ndl + vec3(specComp) * 0.1,1.0); // apply color and lighting
}