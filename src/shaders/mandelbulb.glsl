precision highp float;

// based on https://www.shadertoy.com/view/tsBXW3

#define DISK_STEPS 12.0 //disk texture layers

varying vec2 vUV;

uniform float time;
uniform float planetRadius;
uniform float accretionDiskRadius;
uniform float rotationPeriod;

//TODO: make these uniforms
const float accretionDiskHeight = 100.0;
const bool hasAccretionDisk = true;

uniform vec3 rotationAxis;
uniform vec3 forwardAxis;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

uniform sampler2D starfieldTexture;

uniform vec3 planetPosition;
uniform vec3 cameraPosition;

uniform mat4 view;
uniform mat4 projection;
uniform mat4 inverseView;
uniform mat4 inverseProjection;

uniform float cameraNear;
uniform float cameraFar;

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=inverseProjection, inverseView=inverseView)

#pragma glslify: uvFromWorld = require(./utils/uvFromWorld.glsl, projection=projection, view=view)

#pragma glslify: rotateAround = require(./utils/rotateAround.glsl)

#pragma glslify: rayIntersectSphere = require(./utils/rayIntersectSphere.glsl)

vec3 projectOnPlane(vec3 vector, vec3 planeNormal) {
    return vector - dot(vector, planeNormal) * planeNormal;
}

float angleBetweenVectors(vec3 a, vec3 b) {
    // the clamping is necessary to prevent undefined values when acos(x) has |x| > 1
    return acos(clamp(dot(normalize(a), normalize(b)), -1.0, 1.0));
}


#define MARCHINGITERATIONS 64

#define MARCHINGSTEP 0.5
#define SMALLESTSTEP 0.1

#define DISTANCE 3.0

#define MAXMANDELBROTDIST 1.5
#define MANDELBROTSTEPS 64

// cosine based palette, 4 vec3 params
vec3 cosineColor( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}
vec3 palette (float t) {
    return cosineColor( t, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(0.01,0.01,0.01),vec3(0.00, 0.15, 0.20) );
}

// distance estimator to a mandelbulb set
// returns the distance to the set on the x coordinate 
// and the color on the y coordinate
vec2 DE(vec3 pos) {
    float Power = 8.0; //3.0+4.0*(sin(iTime/30.0)+1.0);
	vec3 z = pos;
	float dr = 1.0;
	float r = 0.0;
	for (int i = 0; i < MANDELBROTSTEPS ; i++) {
		r = length(z);
		if (r>MAXMANDELBROTDIST) break;
		
		// convert to polar coordinates
		float theta = acos(z.z/r);
		float phi = atan(z.y,z.x);
		dr =  pow( r, Power-1.0)*Power*dr + 1.0;
		
		// scale and rotate the point
		float zr = pow( r,Power);
		theta = theta*Power;
		phi = phi*Power;
		
		// convert back to cartesian coordinates
		z = zr*vec3(sin(theta)*cos(phi), sin(phi)*sin(theta), cos(theta));
		z+=pos;
	}
	return vec2(0.5*log(r)*r/dr,50.0*pow(dr,0.128/float(MARCHINGITERATIONS)));
}

// MAPPING FUNCTION ... 
// returns the distance of the nearest object in the direction p on the x coordinate 
// and the color on the y coordinate
vec2 map( in vec3 p )
{
    //p = fract(p);
   	vec2 d = DE(p);

  

   	return d;
}


// TRACING A PATH : 
// measuring the distance to the nearest object on the x coordinate
// and returning the color index on the y coordinate
vec2 trace  (vec3 origin, vec3 ray) {
	
    //t is the point at which we are in the measuring of the distance
    float t =0.0;
    float c = 0.0;
    
    for (int i=0; i< MARCHINGITERATIONS; i++) {
    	vec3 path = origin + ray * t;	
    	vec2 dist = map(path);
    	// we want t to be as large as possible at each step but not too big to induce artifacts
        t += MARCHINGSTEP * dist.x;
        c += dist.y;
        if (dist.y < SMALLESTSTEP) break;
    }
    
    return vec2(t,c);
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    vec3 pixelWorldPosition = worldFromUV(vUV);// the pixel position in world space (near plane)
    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition);// normalized direction of the ray

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map
    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint);// the maxium ray length due to occlusion

    vec4 outColor;

    vec3 planetPosition = vec3(15.0, 0.0, 0.0);
    float planetRadius = 2.0;

    float impactPoint, escapePoint;
    if (!(rayIntersectSphere(cameraPosition, rayDir, planetPosition, planetRadius, impactPoint, escapePoint))) {
        outColor = screenColor;// if not intersecting with atmosphere, return original color
    } else {
        vec3 rayOrigin = cameraPosition + impactPoint * rayDir; // the ray origin in world space
        vec2 mandelDepth = trace(cameraPosition - planetPosition, rayDir);

        // if mandelDepth is close to cameraFar, outColor is original color
        //if(abs(mandelDepth - cameraFar) < 100.0) outColor = screenColor;
        //else {

            //rendering with a fog calculation (further is darker)
            float fog = 1.0 / (1.0 + mandelDepth.x /* mandelDepth.x*/ * 0.1);
            
            //frag color
            vec3 fc = vec3(fog);
            
            // Output to screen
            outColor = vec4(palette(mandelDepth.y), 1.0);

        //}
    }

    gl_FragColor = outColor;
}
