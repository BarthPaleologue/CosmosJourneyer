//---------------------------------------------------------------------------
//1D Perlin noise implementation 
//---------------------------------------------------------------------------
#define HASHSCALE 0.1031

float hash(float p)
{
	vec3 p3  = fract(vec3(p) * HASHSCALE);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

float fade(float t) { return t*t*t*(t*(6.*t-15.)+10.); }

float grad(float hash, float p)
{
    int i = int(1e4*hash);
	return (i & 1) == 0 ? p : -p;
}

float perlinNoise1D(float p) {
	float pi = floor(p), pf = p - pi, w = fade(pf);
    return 0.5 * (1.0 + mix(grad(hash(pi), pf), grad(hash(pi + 1.0), pf - 1.0), w) * 2.0);
}

float completeNoise(float pos, int octaves, float decay, float persistence) {
    float total = 0., frequency = 1., amplitude = 1., maxValue = 0.;
    for(int i = 0; i < octaves; ++i) {
        total += perlinNoise1D(pos * frequency) * amplitude;
        maxValue += amplitude;
        amplitude /= persistence;
        frequency /= decay;
    }
    return total / maxValue;
}