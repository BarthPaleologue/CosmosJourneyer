float hash3(float3 point, float seed) {
    return frac(sin(dot(point, float3(127.1, 311.7, 74.7)) + seed * 0.001) * 43758.5453);
}

float valueNoise(float3 point, float seed) {
    float3 cell = floor(point);
    float3 local = frac(point);
    float3 blend = local * local * (float3(3.0) - 2.0 * local);
    float x00 = lerp(hash3(cell, seed), hash3(cell + float3(1.0, 0.0, 0.0), seed), blend.x);
    float x10 = lerp(hash3(cell + float3(0.0, 1.0, 0.0), seed), hash3(cell + float3(1.0, 1.0, 0.0), seed), blend.x);
    float x01 = lerp(hash3(cell + float3(0.0, 0.0, 1.0), seed), hash3(cell + float3(1.0, 0.0, 1.0), seed), blend.x);
    float x11 = lerp(hash3(cell + float3(0.0, 1.0, 1.0), seed), hash3(cell + float3(1.0, 1.0, 1.0), seed), blend.x);
    return lerp(lerp(x00, x10, blend.y), lerp(x01, x11, blend.y), blend.z) * 2.0 - 1.0;
}

float fractalNoise(float3 point, float seed, uint octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float amplitudeSum = 0.0;
    for (uint octave = 0; octave < octaves; octave++) {
        value += amplitude * valueNoise(point * frequency, seed + float(octave) * 19.19);
        amplitudeSum += amplitude;
        frequency *= 2.03;
        amplitude *= 0.5;
    }
    return value / amplitudeSum;
}

struct TerrainSettings {
    float seed;
    float continentBaseHeight;
    float continentsFragmentation;
    float continentsFrequency;
    float maxMountainHeight;
    float mountainsFrequency;
    float maxBumpHeight;
    float bumpsFrequency;
};

float terrainElevation(float3 unitPosition, TerrainSettings settings) {
    float continentNoise = fractalNoise(unitPosition * settings.continentsFrequency, settings.seed, 6);
    float fragmented = 1.0 - settings.continentsFragmentation * (1.0 - (continentNoise * 0.5 + 0.5));
    float continentMask = smoothstep(0.3, 0.5, fragmented);
    float ridgeNoise = fractalNoise(unitPosition * settings.mountainsFrequency, settings.seed + 101.0, 7);
    float ridges = smoothstep(0.4, 1.0, 1.0 - abs(ridgeNoise));
    float mountainMask =
        fractalNoise(unitPosition * settings.mountainsFrequency * 0.25, settings.seed + 211.0, 2) * 0.5 + 0.5;
    float bumps = fractalNoise(unitPosition * settings.bumpsFrequency, settings.seed + 307.0, 4);
    return continentMask * settings.continentBaseHeight +
           continentMask * mountainMask * ridges * settings.maxMountainHeight + bumps * settings.maxBumpHeight;
}
