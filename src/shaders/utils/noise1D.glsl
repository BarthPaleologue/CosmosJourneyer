float mod289(float x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 perm(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }

float noise(float r) {
    float a = floor(r);
    float d = r - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = vec4(a) + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + vec4(a);
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d + o1 * (1.0 - d);
    vec2 o4 = o3.yw * d + o3.xz * (1.0 - d);

    return o4.y * d + o4.x * (1.0 - d);
}


float completeNoise(float r, int nbOctaves, float decay, float lacunarity) {
    float totalAmplitude = 0.0;
    float amp = 1.0;
    float samplePointMultiplier = 1.0;
    float value = 0.0;
    for (int i = 0; i < nbOctaves; i++) {
        amp /= decay;
        samplePointMultiplier *= lacunarity;
        totalAmplitude += amp;
        value += amp * noise(r * samplePointMultiplier);
    }
    return value / totalAmplitude;
}

#pragma glslify: export(completeNoise)