//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

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