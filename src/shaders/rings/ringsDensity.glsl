#include "../utils/noise1D.glsl";

#include "../utils/remap.glsl";

float ringDensityAtPoint(vec3 samplePoint) {
    vec3 samplePointPlanetSpace = samplePoint - object_position;

    float distanceToPlanet = length(samplePointPlanetSpace);
    float normalizedDistance = distanceToPlanet / object_radius;

    float uvX = remap(normalizedDistance, rings_start, rings_end, 0.0, 1.0);
    float lutDensity = texture2D(rings_lut, vec2(uvX, 0.0)).x;

    // out if not intersecting with rings and interpolation area
    if (normalizedDistance < rings_start || normalizedDistance > rings_end) return 0.0;
    return lutDensity;
}