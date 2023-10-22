#pragma glslify: completeNoise = require(../utils/noise1D.glsl)

float ringDensityAtPoint(vec3 samplePoint) {
    vec3 samplePointPlanetSpace = samplePoint - object.position;

    float distanceToPlanet = length(samplePointPlanetSpace);
    float normalizedDistance = distanceToPlanet / object.radius;

    // out if not intersecting with rings and interpolation area
    if (normalizedDistance < rings.start || normalizedDistance > rings.end) return 0.0;

    // compute the actual density of the rings at the sample point
    float macroRingDensity = completeNoise(normalizedDistance * rings.frequency / 10.0, 1, 2.0, 2.0);
    float ringDensity = completeNoise(normalizedDistance * rings.frequency, 5, 2.0, 2.0);
    ringDensity = mix(ringDensity, macroRingDensity, 0.5);
    ringDensity *= smoothstep(rings.start, rings.start + 0.03, normalizedDistance);
    ringDensity *= smoothstep(rings.end, rings.end - 0.03, normalizedDistance);

    ringDensity *= ringDensity;

    return ringDensity;
}

#pragma glslify: export(ringDensityAtPoint)