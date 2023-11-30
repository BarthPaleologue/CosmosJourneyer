#pragma glslify: completeNoise = require(../utils/noise1D.glsl)

#pragma glslify: remap = require(../utils/remap.glsl)

float ringDensityAtPoint(vec3 samplePoint) {
    vec3 samplePointPlanetSpace = samplePoint - object.position;


    float distanceToPlanet = length(samplePointPlanetSpace);
    float normalizedDistance = distanceToPlanet / object.radius;

    // out if not intersecting with rings and interpolation area
    if (normalizedDistance < rings.start || normalizedDistance > rings.end) return 0.0;

    float uvX = remap(normalizedDistance, rings.start, rings.end, 0.0, 1.0);
    return texture2D(ringsLUT, vec2(uvX, 0.0)).x;
}

#pragma glslify: export(ringDensityAtPoint)