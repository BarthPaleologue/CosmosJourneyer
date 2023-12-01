precision highp float;

#define PI 3.1415926535897932
#define POINTS_FROM_CAMERA 12// number sample points along camera ray
#define OPTICAL_DEPTH_POINTS 12// number sample points along light ray

varying vec2 vUV;// screen coordinates

// uniforms
uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

uniform sampler2D atmosphereLUT;

uniform int nbStars;// number of stars

#include "./utils/stars.glsl";

#include "./utils/camera.glsl";

#include "./utils/object.glsl";

#include "./utils/atmosphere.glsl";

#include "./utils/remap.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/rayIntersectSphere.glsl";

// based on https://www.youtube.com/watch?v=DxfEbulyFcY by Sebastian Lague
vec2 densityAtPoint(vec3 samplePoint) {
    float heightAboveSurface = length(samplePoint - object_position) - object_radius;
    float height01 = heightAboveSurface / (atmosphere_radius - object_radius);// normalized height between 0 and 1

    vec2 localDensity = vec2(
    atmosphere_densityModifier * exp(-height01 * atmosphere_falloff),
    atmosphere_densityModifier * exp(-height01 * atmosphere_falloff * 0.5)
    );

    localDensity *= (1.0 - height01);

    return localDensity;// density with exponential falloff
}


vec2 opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength) {

    vec3 densitySamplePoint = rayOrigin;// that's where we start

    float stepSize = rayLength / float(OPTICAL_DEPTH_POINTS - 1);// ray length between sample points

    vec2 accumulatedOpticalDepth = vec2(0.0);

    for (int i = 0; i < OPTICAL_DEPTH_POINTS; i++) {
        accumulatedOpticalDepth += densityAtPoint(densitySamplePoint) * stepSize;// linear approximation : density is constant between sample points
        densitySamplePoint += rayDir * stepSize;// we move the sample point
    }

    return accumulatedOpticalDepth;
}

vec3 calculateLight(vec3 rayOrigin, vec3 starPosition, vec3 rayDir, float rayLength, vec3 originalColor) {

    vec3 samplePoint = rayOrigin;// first sampling point coming from camera ray

    vec3 wavelength = vec3(atmosphere_redWaveLength, atmosphere_greenWaveLength, atmosphere_blueWaveLength);// the wavelength that will be scattered (rgb so we get everything)

    // Scattering Coeffs
    vec3 rayleighCoeffs = pow(1063.0 / wavelength.xyz, vec3(4.0)) * atmosphere_rayleighStrength;// the scattering is inversely proportional to the fourth power of the wave length
    rayleighCoeffs /= object_radius;

    vec3 mieCoeffs = vec3(2.5e-2) * atmosphere_mieStrength;
    mieCoeffs /= object_radius;

    float stepSize = rayLength / float(POINTS_FROM_CAMERA - 1);// the ray length between sample points

    // Computing the scattering

    vec3 inScatteredRayleigh = vec3(0.0);
    vec3 inScatteredMie = vec3(0.0);

    vec3 starDir = normalize(starPosition - object_position);

    for (int i = 0; i < POINTS_FROM_CAMERA; i++, samplePoint += rayDir * stepSize) {
        float _, t1;
        rayIntersectSphere(samplePoint, starDir, object_position, atmosphere_radius, _, t1);
        float sunRayLengthInAtm = t1;

        /*float height = length(samplePoint - object_position);
        float heightAboveSurface = height - object_radius;
        float height01 = heightAboveSurface / (atmosphere_radius - object_radius);// normalized height between 0 and 1
        vec3 planetNormal = normalize(samplePoint - object_position);
        float costheta = -dot(starDir, planetNormal) * 0.99;
        float lutx = (costheta + 1.0) / 2.0;
        vec2 sunRayOpticalDepth = 1e5 * ((1.0 / (texture2D(atmosphereLUT, vec2(lutx, height01)).rg)) - 1.0);*/
        vec2 sunRayOpticalDepth = opticalDepth(samplePoint, starDir, sunRayLengthInAtm);// scattered from the sun to the point

        /*float costheta2 = dot(-rayDir, planetNormal) * 0.99;
        float lutx2 = (costheta2 + 1.0) / 2.0;
        vec2 viewRayOpticalDepth = 1.0 * exp(texture2D(atmosphereLUT, vec2(lutx2, height01)).rg - 1.0);*/
        vec2 viewRayOpticalDepth = opticalDepth(samplePoint, -rayDir, stepSize * float(i));// scattered from the point to the camera

        vec3 transmittance = exp(-(sunRayOpticalDepth.x + viewRayOpticalDepth.x) * rayleighCoeffs);
        vec3 mieTransmittance = exp(-(sunRayOpticalDepth.y + viewRayOpticalDepth.y) * mieCoeffs);// exponential scattering with coefficients

        vec2 density = densityAtPoint(samplePoint);// density at sample point

        inScatteredRayleigh += density.x * transmittance * rayleighCoeffs * stepSize;// add the resulting amount of light scattered toward the camera
        inScatteredMie += density.y * mieTransmittance * mieCoeffs * stepSize;
    }

    // http://hyperphysics.phy-astr.gsu.edu/hbase/atmos/blusky.html
    // https://www.wikiwand.com/en/Rayleigh_scattering#/From_molecules
    // https://www.shadertoy.com/view/wlBXWK

    float costheta = dot(rayDir, starDir);
    float costheta2 = pow(costheta, 2.0);

    float g = atmosphere_mieHaloRadius;//0.7
    float g2 = g * g;

    float phaseMie = ((3.0 * (1.0 - g2)) / (2.0 * (2.0 + g2))) * ((1.0 + costheta2) / pow(1.0 + g2 - 2.0 * g * costheta, 1.5));

    // scattering depends on the direction of the light ray and the view ray : it's the rayleigh phase function
    // https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-16-accurate-atmospheric-scattering
    float phaseRayleigh = (3.0 / (16.0 * PI)) * (1.0 + costheta2);

    inScatteredRayleigh *= phaseRayleigh;// apply rayleigh pahse
    inScatteredMie *= phaseMie;

    return (inScatteredRayleigh + inScatteredMie) * atmosphere_sunIntensity;
}

vec4 scatter(vec4 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
    float impactPoint, escapePoint;
    if (!(rayIntersectSphere(rayOrigin, rayDir, object_position, atmosphere_radius, impactPoint, escapePoint))) {
        return originalColor;// if not intersecting with atmosphere, return original color
    }

    impactPoint = max(0.0, impactPoint);// cannot be negative (the ray starts where the camera is in such a case)
    escapePoint = min(maximumDistance, escapePoint);// occlusion with other scene objects

    float distanceThroughAtmosphere = max(0.0, escapePoint - impactPoint);// probably doesn't need the max but for the sake of coherence the distance cannot be negative

    vec3 firstPointInAtmosphere = rayOrigin + rayDir * impactPoint;// the first atmosphere point to be hit by the ray

    vec3 light = vec3(0.0);
    for (int i = 0; i < nbStars; i++) {
        light = max(light, calculateLight(firstPointInAtmosphere, star_positions[i], rayDir, distanceThroughAtmosphere, originalColor.rgb));// calculate scattering
    }

    float lightAlpha = max(light.r, max(light.g, light.b));
    return vec4(mix(originalColor.rgb, vec3(1.0), light), max(originalColor.a, lightAlpha));
}


void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)

    vec3 rayDir = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);

    // Cohabitation avec le shader d'océan (un jour je merge)
    float waterImpact, waterEscape;
    if (rayIntersectSphere(camera_position, rayDir, object_position, object_radius, waterImpact, waterEscape)) {
        maximumDistance = min(maximumDistance, waterImpact);
    }

    vec4 finalColor = scatter(screenColor, camera_position, rayDir, maximumDistance);// the color to be displayed on the screen

    gl_FragColor = finalColor;// displaying the final color
}
