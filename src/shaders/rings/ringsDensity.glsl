#include "../utils/noise1D.glsl";

#include "../utils/remap.glsl";

float ringDensityAtPoint(vec3 samplePoint) {
    vec3 samplePointPlanetSpace = samplePoint - object_position;

    float distanceToPlanet = length(samplePointPlanetSpace);
    float relativeDistance = distanceToPlanet / object_radius;

    // out if not intersecting with rings and interpolation area
    if (relativeDistance < rings_start || relativeDistance > rings_end) return 0.0;

    float uvX = remap(relativeDistance, rings_start, rings_end, 0.0, 1.0);
    float lutDensity = texture2D(rings_lut, vec2(uvX, 0.0)).x;

    return lutDensity;
}