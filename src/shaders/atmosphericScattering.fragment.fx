precision lowp float;

#define PI 3.1415926535897932
#define PI4 97.40909103400242
#define POINTS_FROM_CAMERA 10 // number sample points along camera ray
#define OPTICAL_DEPTH_POINTS 8 // number sample points along light ray

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
uniform float rayleighStrength; // controls color dispersion
uniform float mieStrength;
uniform float densityModifier; // density of the atmosphere

uniform float redWaveLength; // the wave length for the red part of the scattering
uniform float greenWaveLength; // same with green
uniform float blueWaveLength; // same with blue

uniform float mieHaloRadius;

// remap a value comprised between low1 and high1 to a value between low2 and high2
float remap(float value, float low1, float high1, float low2, float high2) {
    return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
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
    float b = 2.0 * dot(relativeOrigin, rayDir); // sera toujours positif quand on regarde la planète
    float c = dot(relativeOrigin, relativeOrigin) - sphereRadius*sphereRadius;
    
    float d = b*b - 4.0*a*c;

    if(d <= 0.0) return false; // no intersection

    float s = sqrt(d);

    float r0 = (-b - s) / (2.0*a);
    float r1 = (-b + s) / (2.0*a);

    t0 = max(min(r0, r1), 0.0);
    t1 = max(max(r0, r1), 0.0);

    return (t1 > 0.0);
}

// based on https://www.youtube.com/watch?v=DxfEbulyFcY by Sebastian Lague
float densityAtPoint(vec3 samplePoint) {
    float heightAboveSurface = length(samplePoint - planetPosition) - (planetRadius); // actual height above surface
    
    float height01 = heightAboveSurface / (atmosphereRadius - (planetRadius)); // normalized height between 0 and 1
    
    // FIXME: le fix le plus au pif du monde
    height01 = remap(height01, 0.0, 1.0, 0.4, 1.0);

    float localDensity = densityModifier * exp(-height01 * falloffFactor); // density with exponential falloff

    return localDensity;
}

// Absorption coeffs
// FIXME: put those somewhere else

float absorptionFalloff = 4e3;
float heightOfMaxAbsorption = 30e3;
vec3 absorptionCoeffs = vec3(2.04e-5, 4.97e-5, 1.95e-6);

vec3 opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength) {

    vec3 densitySamplePoint = rayOrigin; // that's where we start

    float stepSize = rayLength / float(OPTICAL_DEPTH_POINTS - 1); // ray length between sample points
    
    vec3 accumulatedOpticalDepth = vec3(0.0);

    for(int i = 0 ; i < OPTICAL_DEPTH_POINTS ; ++i) {
        vec3 localDensity = vec3(densityAtPoint(densitySamplePoint)); // we get the density at the sample point

        float height = length(densitySamplePoint - planetPosition);

        float denom = (heightOfMaxAbsorption - height) / absorptionFalloff;
        localDensity.z *= (1.0 / (denom * denom + 1.0));

        accumulatedOpticalDepth += localDensity * stepSize; // linear approximation : density is constant between sample points

        densitySamplePoint += rayDir * stepSize; // we move the sample point
    }

    return accumulatedOpticalDepth;
}

vec3 calculateLight(vec3 rayOrigin, vec3 rayDir, float rayLength) {

    vec3 samplePoint = rayOrigin; // first sampling point coming from camera ray

    vec3 sunDir = normalize(sunPosition - samplePoint); // direction to the light source
    
    vec3 wavelength = vec3(redWaveLength, greenWaveLength, blueWaveLength); // the wavelength that will be scattered (rgb so we get everything)

    // http://hyperphysics.phy-astr.gsu.edu/hbase/atmos/blusky.html
    // https://www.wikiwand.com/en/Rayleigh_scattering#/From_molecules
    // https://www.shadertoy.com/view/wlBXWK

    float costheta = dot(rayDir, sunDir);
    float costheta2 = pow(costheta, 2.0);

    // Rayleigh Scattering Coeffs

    //float phaseRayleigh = 1.0 + costheta2;

    float alpha = 0.8 * 7.4 + 0.2 * 5.3; // Polarizability // TODO: make uniform

    float prefix = 0.035 * 8.0 * PI4 * pow(alpha, 2.0);

    vec3 rayleighCoeffs = pow(400.0 / wavelength.xyz, vec3(4.0)) * rayleighStrength; // the scattering is inversely proportional to the fourth power of the wave length

    //rayleighCoeffs = vec3(5.5e-6, 13.0e-6, 22.4e-6);

    float stepSize = rayLength / float(POINTS_FROM_CAMERA - 1); // the ray length between sample points

    // Mie Scattering coeffs
    float g = mieHaloRadius; //0.7
    float gg = g * g;

    vec3 mieCoeffs = vec3(10e-3) * mieStrength; //21e-6
    float phaseMie = 3.0 / (8.0 * PI) * ((1.0 - gg) * (costheta2 + 1.0)) / (pow(1.0 + gg - 2.0 * costheta * g, 1.5) * (2.0 + gg));

    // Computing the scattering

    vec3 inScatteredRayleigh = vec3(0.0); // amount of light scattered for each channel
    vec3 inScatteredMie = vec3(0.0);

    for (int i = 0 ; i < POINTS_FROM_CAMERA ; ++i) {

        float sunRayLengthInAtm = atmosphereRadius - length(samplePoint - planetPosition); // distance traveled by light through atmosphere from light source
        
        sunRayLengthInAtm = min(sunRayLengthInAtm, atmosphereRadius - planetRadius);

        float height = length(samplePoint - planetPosition);

        float viewRayLengthInAtm = stepSize * float(i); // distance traveled by light through atmosphere from sample point to cameraPosition
        
        vec3 sunRayOpticalDepth = opticalDepth(samplePoint, sunDir, sunRayLengthInAtm); // scattered from the sun to the point
        
        vec3 viewRayOpticalDepth = opticalDepth(samplePoint, -rayDir, viewRayLengthInAtm); // scattered from the point to the camera
        
        vec3 transmittance = exp(- (sunRayOpticalDepth.x + viewRayOpticalDepth.x) * rayleighCoeffs - (sunRayOpticalDepth.y + viewRayOpticalDepth.y) * mieCoeffs - (sunRayOpticalDepth.z + viewRayOpticalDepth.z) * absorptionCoeffs); // exponential scattering with coefficients
        
        vec3 localDensity = vec3(densityAtPoint(samplePoint)); // density at sample point
        float denom = (heightOfMaxAbsorption - height) / absorptionFalloff;
        localDensity.z *= (1.0 / (denom * denom + 1.0));

        inScatteredRayleigh += localDensity.x * transmittance * rayleighCoeffs * stepSize; // add the resulting amount of light scattered toward the camera
        inScatteredMie += localDensity.y * transmittance * mieCoeffs * stepSize;

        samplePoint += rayDir * stepSize; // move sample point along view ray
    }

    // scattering depends on the direction of the light ray and the view ray : it's the rayleigh phase function
    // https://glossary.ametsoc.org/wiki/Rayleigh_phase_function
    //float costheta2 = pow(dot(rayDir, sunDir), 2.0);
    float phaseRayleigh = (3.0 / (16.0 * PI)) * (1.0 + costheta2);
    
    inScatteredRayleigh *= phaseRayleigh; // apply rayleigh pahse
    inScatteredMie *= phaseMie;
    
    return (inScatteredRayleigh + inScatteredMie) * sunIntensity;
}

vec3 scatter(vec3 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
    float impactPoint, escapePoint;
    if (!(rayIntersectSphere(rayOrigin, rayDir, planetPosition, atmosphereRadius, impactPoint, escapePoint))) {
        return originalColor; // if not intersecting with atmosphere, return original color
    }

    impactPoint = max(0.0, impactPoint); // cannot be negative (the ray starts where the camera is in such a case)
    escapePoint = min(maximumDistance, escapePoint); // occlusion with other scene objects

    float distanceThroughAtmosphere = max(0.0, escapePoint - impactPoint); // probably doesn't need the max but for the sake of coherence the distance cannot be negative

    //distanceThroughAtmosphere = min(escapePoint - impactPoint, maximumDistance - impactPoint);

    vec3 firstPointInAtmosphere = rayOrigin + rayDir * impactPoint; // the first atmosphere point to be hit by the ray

    vec3 light = calculateLight(firstPointInAtmosphere, rayDir, distanceThroughAtmosphere); // calculate scattering
    
    return light + (1.0 - light) * originalColor; // blending scattered color with original color
}


void main() {
    vec3 screenColor = texture2D(textureSampler, vUV).rgb; // the current screen color

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
    
    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion


    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition); // normalized direction of the ray

    // Cohabitation avec le shader d'océan (un jour je merge)
    float waterImpact, waterEscape;
    if(rayIntersectSphere(cameraPosition, rayDir, planetPosition, planetRadius, waterImpact, waterEscape)) {
        maximumDistance = min(maximumDistance, waterImpact);
    }

    vec3 finalColor = scatter(screenColor, cameraPosition, rayDir, maximumDistance); // the color to be displayed on the screen

    gl_FragColor = vec4(finalColor, 1.0); // displaying the final color
    
}