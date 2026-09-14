float3 hash33(float3 point, float seed)
{
    float3 value = frac((point + float3(seed * 0.0001)) * float3(0.1031, 0.1030, 0.0973));
    value += dot(value, value.yxz + float3(33.33));
    return frac((value.xxy + value.yxx) * value.zyx);
}

float gradientNoise(float3 point, float seed)
{
    float3 cell = floor(point);
    float3 local = frac(point);
    float3 blend = local * local * local * (local * (local * 6.0 - float3(15.0)) + float3(10.0));

    float3 g000 = hash33(cell, seed) * 2.0 - float3(1.0);
    float3 g100 = hash33(cell + float3(1.0, 0.0, 0.0), seed) * 2.0 - float3(1.0);
    float3 g010 = hash33(cell + float3(0.0, 1.0, 0.0), seed) * 2.0 - float3(1.0);
    float3 g110 = hash33(cell + float3(1.0, 1.0, 0.0), seed) * 2.0 - float3(1.0);
    float3 g001 = hash33(cell + float3(0.0, 0.0, 1.0), seed) * 2.0 - float3(1.0);
    float3 g101 = hash33(cell + float3(1.0, 0.0, 1.0), seed) * 2.0 - float3(1.0);
    float3 g011 = hash33(cell + float3(0.0, 1.0, 1.0), seed) * 2.0 - float3(1.0);
    float3 g111 = hash33(cell + float3(1.0, 1.0, 1.0), seed) * 2.0 - float3(1.0);

    float x00 = lerp(dot(g000, local), dot(g100, local - float3(1.0, 0.0, 0.0)), blend.x);
    float x10 = lerp(
        dot(g010, local - float3(0.0, 1.0, 0.0)),
        dot(g110, local - float3(1.0, 1.0, 0.0)),
        blend.x
    );
    float x01 = lerp(
        dot(g001, local - float3(0.0, 0.0, 1.0)),
        dot(g101, local - float3(1.0, 0.0, 1.0)),
        blend.x
    );
    float x11 = lerp(
        dot(g011, local - float3(0.0, 1.0, 1.0)),
        dot(g111, local - float3(1.0, 1.0, 1.0)),
        blend.x
    );
    return lerp(lerp(x00, x10, blend.y), lerp(x01, x11, blend.y), blend.z);
}

float fractalNoise(float3 point, float seed, uint octaves)
{
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float amplitudeSum = 0.0;
    for (uint octave = 0; octave < octaves; octave++)
    {
        value += amplitude * gradientNoise(point * frequency, seed + float(octave) * 19.19);
        amplitudeSum += amplitude;
        frequency *= 2.03;
        amplitude *= 0.5;
    }
    return value / amplitudeSum;
}

float cellularDistance(float3 point, float seed)
{
    float3 cell = floor(point);
    float3 local = frac(point);
    float nearestSquared = 4.0;
    for (int x = -1; x <= 1; x++)
    {
        for (int y = -1; y <= 1; y++)
        {
            for (int z = -1; z <= 1; z++)
            {
                float3 neighbor = float3(float(x), float(y), float(z));
                float3 center = neighbor + hash33(cell + neighbor, seed);
                float3 delta = center - local;
                nearestSquared = min(nearestSquared, dot(delta, delta));
            }
        }
    }
    return sqrt(nearestSquared);
}

float craterNoise(float3 point, float seed)
{
    float distance = cellularDistance(point, seed);
    float bowl = -(1.0 - smoothstep(0.12, 0.48, distance));
    float rimDistance = abs(distance - 0.5);
    float rim = 0.35 * (1.0 - smoothstep(0.0, 0.08, rimDistance));
    float centralHill = 0.16 * (1.0 - smoothstep(0.0, 0.08, distance));
    return bowl + rim + centralHill;
}

struct TerrainSettings
{
    float seed;
    float continentBaseHeight;
    float continentsFragmentation;
    float continentsFrequency;
    float maxMountainHeight;
    float mountainsFrequency;
    float maxBumpHeight;
    float bumpsFrequency;
    float terraceHeight;
    float craterStrength;
    float craterFrequency;
    float erosion;
};

float terrainElevation(float3 unitPosition, TerrainSettings settings)
{
    float seed = settings.seed;
    float fragmentation = settings.continentsFragmentation;
    float3 continentPoint = unitPosition * settings.continentsFrequency;
    float continentNoise = fractalNoise(continentPoint, seed, 7);
    float continentDetail = fractalNoise(continentPoint * 3.7, seed + 47.0, 4);
    float continentSignal = continentNoise + continentDetail * fragmentation * 0.55;
    float continentMask = smoothstep(-0.08, 0.08, continentSignal);

    float fjordNoise = abs(fractalNoise(unitPosition * settings.continentsFrequency * 12.0, seed + 79.0, 3));
    float fjordMask = continentMask * fragmentation * (1.0 - smoothstep(0.015, 0.09, fjordNoise));

    float ridgeNoise = fractalNoise(unitPosition * settings.mountainsFrequency, seed + 101.0, 7);
    float ridges = pow(clamp(1.0 - abs(ridgeNoise) * 2.0, 0.0, 1.0), lerp(1.0, 2.5, settings.erosion));
    float mountainMask = smoothstep(
        -0.15,
        0.2,
        fractalNoise(unitPosition * settings.mountainsFrequency * 0.2, seed + 211.0, 3)
    );
    float mountainElevation = continentMask * mountainMask * ridges * settings.maxMountainHeight;

    float terraceHeight = settings.terraceHeight;
    float terraceLevel = mountainElevation / terraceHeight;
    float terracedMountains =
        (floor(terraceLevel) + smoothstep(0.42, 0.58, frac(terraceLevel))) * terraceHeight;
    float terraceMask = smoothstep(
        -0.2,
        0.25,
        fractalNoise(unitPosition * settings.mountainsFrequency * 0.08, seed + 263.0, 2)
    );

    float bumps = fractalNoise(unitPosition * settings.bumpsFrequency, seed + 307.0, 4) * settings.maxBumpHeight;
    float craters = 0.0;
    if (settings.craterStrength > 0.0)
    {
        float3 craterPoint = unitPosition * settings.craterFrequency;
        float largeCraters = craterNoise(craterPoint, seed + 401.0);
        float smallCraters = craterNoise(craterPoint * 2.1, seed + 503.0) * 0.35;
        craters = (largeCraters + smallCraters) * settings.craterStrength;
    }

    float continentalCrust = continentMask * settings.continentBaseHeight;
    float fjordDepth = fjordMask * (settings.continentBaseHeight + settings.maxMountainHeight * 0.25);
    return continentalCrust
        - fjordDepth
        + lerp(mountainElevation, terracedMountains, terraceMask * 0.35)
        + bumps
        + craters;
}
