precision highp float;

#define PI 3.1415926535897932
#define POINTS_FROM_CAMERA 4 // number sample points along camera ray
#define OPTICAL_DEPTH_POINTS 4 // number sample points along light ray

#define NUM_CELLS 8.0

// varying
varying vec2 vUV; // screen coordinates

// uniforms
uniform sampler2D textureSampler; // the original screen texture
uniform sampler2D depthSampler; // the depth map of the camera

uniform vec3 sunPosition; // position of the sun in world space
uniform vec3 cameraPosition; // position of the camera in world space

uniform mat4 projection; // camera's projection matrix
uniform mat4 view; // camera's view matrix

uniform float cameraNear; // camera minZ
uniform float cameraFar; // camera maxZ

uniform vec3 planetPosition; // planet position in world space
uniform float planetRadius; // planet radius for height calculations
uniform float atmosphereRadius; // atmosphere radius (calculate from planet center)

uniform float falloffFactor; // controls exponential opacity falloff
uniform float sunIntensity; // controls atmosphere overall brightness
uniform float scatteringStrength; // controls color dispersion
uniform float densityModifier; // density of the atmosphere

uniform float redWaveLength; // the wave length for the red part of the scattering
uniform float greenWaveLength; // same with green
uniform float blueWaveLength; // same with blue



#define LCG(k) k = (65 * k) % 1021
#define lr(k) float(k)/1021.

// permutation polynomial

int permp (int i1, int i2){
      int t = (i1 + i2) & 255;
        
      return ((112 * t + 153) * t + 151) & 255;
}

// return the two closest distances for 3D Worley noise

vec2 worley3(vec3 p) {
    vec2 dl = vec2(20.0);
    
    float value = 20.0;
    
    ivec3 iv = ivec3(floor(p));
    vec3 fv = fract(p);
    
    int j = 0; // initialization for Knuth's "algorithm L"
    ivec3 di = ivec3(1), ki = -di;
    ivec4 fi = ivec4(0, 1, 2, 3);
    
    // instead of writing a triply nested loop (!!)
    // generate the indices for the neighbors in Gray order (Knuth's "algorithm L")
    // see section 7.2.1.1 of TAOCP, Volume 4A or https://doi.org/10.1145/360336.360343
    
	for (int k = 0; k < 27; k++) // loop through all neighbors
    { 
		 // seeding
        int s = permp(permp(permp(0, iv.z + ki.z), iv.y + ki.y), iv.x + ki.x); LCG(s);
            
		 for (int m = 0; m < 2; m++) // two points per cell
             {
                // generate feature points within the cell
                LCG(s); float sz = lr(s);
                LCG(s); float sy = lr(s);
                LCG(s); float sx = lr(s);
                
                vec3 tp = vec3(ki) + vec3(sx, sy, sz) - fv;
                float c = dot(tp, tp); // Euclidean metric
                
                float m1 = min(c, dl.x); // ranked distances
                dl = vec2(min(m1, dl.y), max(m1, min(max(c, dl.x), dl.y)));
             }
        
        // updating steps for Knuth's "algorithm L"
        j = fi[0]; fi[0] = 0; ki[2 - j] += di[j];
        if ((ki[2 - j] & 1) == 1) {
            di[j] = -di[j];
            fi[j] = fi[j + 1]; fi[j + 1] = j + 1;
        }
	}
    
    dl = sqrt(dl); // don't forget to root at the end for Euclidean distance
        
    return dl;
}

// Arbitrary random, can be replaced with a function of your choice
float randWorley(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

// Returns the point in a given cell
vec2 get_cell_point(vec2 cell) {
	vec2 cell_base = vec2(cell) / NUM_CELLS;
	float noise_x = randWorley(vec2(cell));
    float noise_y = randWorley(vec2(cell.yx));
    return cell_base + (0.5 + 1.5 * vec2(noise_x, noise_y)) / NUM_CELLS;
}

// Performs worley noise by checking all adjacent cells
// and comparing the distance to their points
float worley2(vec2 coord) {
    ivec2 cell = ivec2(coord * NUM_CELLS);
    float dist = 1.0;
    
    // Search in the surrounding 5x5 cell block
    for (int x = 0; x < 5; x++) { 
        for (int y = 0; y < 5; y++) {
        	vec2 cell_point = get_cell_point(cell + ivec2(x-2, y-2));
            dist = min(dist, distance(cell_point, coord));
        }
    }
    
    dist /= length(vec2(1.0 / NUM_CELLS));
    dist = 1.0 - dist;
    return dist;
}

// remap a value comprised between low1 and high1 to a value between low2 and high2
float remap(float value, float low1, float high1, float low2, float high2) {
    return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
}

float saturate(float value) {
    if(value < 0.0) return 0.0;
    if(value > 1.0) return 1.0;
    return value;
}

// Noise functions to spice things up a little bit
float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

float completeNoise(vec3 p, int nbOctaves, float decay, float lacunarity) {
	float totalAmplitude = 0.0;
	float value = 0.0;
	for(int i = 0; i < nbOctaves; ++i) {
		totalAmplitude += 1.0 / pow(decay, float(i));
		vec3 samplePoint = p * pow(lacunarity, float(i)); 
		value += noise(samplePoint) / pow(decay, float(i));
	}
	return value / totalAmplitude;
}

// compute the world position of a pixel from its uv coordinates
vec3 worldFromUV(vec2 pos) {
    vec4 ndc = vec4(pos.xy * 2.0 - 1.0, -1.0, 1.0); // get ndc position -1 because i want every point in the near camera plane
    vec4 posVS = inverse(projection) * ndc; // unproject the ndc coordinates : we are now in view space if i understand correctly
    vec4 posWS = inverse(view) * vec4((posVS.xyz / posVS.w), 1.0); // then we use inverse view to get to world space, division by w to get actual coordinates
    return posWS.xyz; // the coordinates in world space
}

// returns whether or not a ray hits a sphere, if yes out intersection points
// a good explanation of how it works : https://viclw17.github.io/2018/07/16/raytracing-ray-sphere-intersection/
bool rayIntersectSphere(vec3 rayOrigin, vec3 rayDir, vec3 spherePosition, float sphereRadius, out float t0, out float t1) {
    vec3 relativeOrigin = rayOrigin - spherePosition; // rayOrigin in sphere space

    float a = 1.0;
    float b = 2.0 * dot(relativeOrigin, rayDir);
    float c = dot(relativeOrigin, relativeOrigin) - sphereRadius*sphereRadius;
    
    float d = b*b - 4.0*a*c;

    if(d < 0.0) return false; // no intersection

    float r0 = (-b - sqrt(d)) / (2.0*a);
    float r1 = (-b + sqrt(d)) / (2.0*a);

    t0 = min(r0, r1);
    t1 = max(r0, r1);

    return (t1 >= 0.0);
}

// based on https://www.youtube.com/watch?v=DxfEbulyFcY by Sebastian Lague
float densityAtPoint(vec3 densitySamplePoint) {
    float heightAboveSurface = length(densitySamplePoint - planetPosition) - planetRadius; // actual height above surface
    float height01 = heightAboveSurface / (atmosphereRadius - planetRadius); // normalized height between 0 and 1
    float localDensity = densityModifier * exp(-height01 * falloffFactor); // density with exponential falloff
    localDensity *= (1.0 - height01); // make it 0 at maximum height

    localDensity = worley3(densitySamplePoint/200000.0).x/300000.0;

    return localDensity;
}

float opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength) {

    float stepSize = rayLength / (float(OPTICAL_DEPTH_POINTS) - 1.0); // ray length between sample points
    
    vec3 densitySamplePoint = rayOrigin; // that's where we start
    float accumulatedOpticalDepth = 0.0;

    for(int i = 0 ; i < OPTICAL_DEPTH_POINTS ; i++) {
        float localDensity = densityAtPoint(densitySamplePoint); // we get the density at the sample point

        accumulatedOpticalDepth += localDensity * stepSize; // linear approximation : density is constant between sample points

        densitySamplePoint += rayDir * stepSize; // we move the sample point
    }

    return accumulatedOpticalDepth;
}

vec3 calculateLight(vec3 rayOrigin, vec3 rayDir, float rayLength, vec3 originalColor) {

    vec3 samplePoint = rayOrigin; // first sampling point coming from camera ray

    vec3 sunDir = normalize(sunPosition - samplePoint); // direction to the light source
    
    vec3 wavelength = vec3(redWaveLength, greenWaveLength, blueWaveLength); // the wavelength that will be scattered (rgb so we get everything)
    vec3 rayleighScatteringCoeffs = pow(400.0 / wavelength.xyz, vec3(4.0)) * scatteringStrength; // the scattering is inversely proportional to the fourth power of the wave length

    float stepSize = rayLength / (float(POINTS_FROM_CAMERA) - 1.0); // the ray length between sample points

    vec3 inScatteredLight = vec3(0.0); // amount of light scattered for each channel

    for (int i = 0 ; i < POINTS_FROM_CAMERA ; ++i) {

        float sunRayLengthInAtm = atmosphereRadius - length(samplePoint - planetPosition); // distance traveled by light through atmosphere from light source
        float viewRayLengthInAtm = stepSize * float(i); // distance traveled by light through atmosphere from sample point to cameraPosition
        
        float sunRayOpticalDepth = opticalDepth(samplePoint, sunDir, sunRayLengthInAtm); // scattered from the sun to the point
        
        float viewRayOpticalDepth = opticalDepth(samplePoint, -rayDir, viewRayLengthInAtm); // scattered from the point to the camera
        
        vec3 transmittance = exp(-(sunRayOpticalDepth + viewRayOpticalDepth) * rayleighScatteringCoeffs); // exponential scattering with coefficients
        
        float localDensity = densityAtPoint(samplePoint); // density at sample point

        inScatteredLight += localDensity * transmittance * rayleighScatteringCoeffs * stepSize; // add the resulting amount of light scattered toward the camera
        
        samplePoint += rayDir * stepSize; // move sample point along view ray
    }

    // scattering depends on the direction of the light ray and the view ray : it's the rayleigh phase function
    // https://glossary.ametsoc.org/wiki/Rayleigh_phase_function
    float costheta2 = pow(dot(rayDir, sunDir), 2.0);
    float phaseRayleigh = (3.0 / (16.0 * PI)) * (1.0 + costheta2);
    
    inScatteredLight *= phaseRayleigh; // apply rayleigh pahse
    inScatteredLight *= sunIntensity; // multiply by the intensity of the sun

    return inScatteredLight;
}

vec3 scatter(vec3 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
    float impactPoint, escapePoint;
    if (!(rayIntersectSphere(rayOrigin, rayDir, planetPosition, atmosphereRadius, impactPoint, escapePoint))) {
        return originalColor; // if not intersecting with atmosphere, return original color
    }

    impactPoint = max(0.0, impactPoint); // cannot be negative (the ray starts where the camera is in such a case)
    escapePoint = min(maximumDistance, escapePoint); // occlusion with other scene objects

    float distanceThroughAtmosphere = max(0.0, escapePoint - impactPoint); // probably doesn't need the max but for the sake of coherence the distance cannot be negative
    
    vec3 firstPointInAtmosphere = rayOrigin + rayDir * impactPoint; // the first atmosphere point to be hit by the ray

    vec3 light = calculateLight(firstPointInAtmosphere, rayDir, distanceThroughAtmosphere, originalColor); // calculate scattering
    
    return originalColor * (1.0 - light) + light; // blending scattered color with original color
}

vec3 lerp(vec3 vector1, vec3 vector2, float x) {
    return x * vector1 + (1.0 - x) * vector2;
}

void main() {
    vec3 screenColor = texture2D(textureSampler, vUV).rgb; // the current screen color

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
    
    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition); // normalized direction of the ray

    vec3 finalColor = scatter(screenColor, cameraPosition, rayDir, maximumDistance); // the color to be displayed on the screen

    finalColor = lerp(finalColor, screenColor, finalColor.x);

    // exposure
    //finalColor = 1.0 - exp(-1.0 * finalColor);
    //finalColor = vec3(1.0);

    gl_FragColor = vec4(finalColor, 1.0); // displaying the final color
}