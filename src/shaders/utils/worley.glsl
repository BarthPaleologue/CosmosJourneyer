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

// Cellular noise ("Worley noise") in 3D in GLSL.
// Copyright (c) Stefan Gustavson 2011-04-19. All rights reserved.
// This code is released under the conditions of the MIT license.
// See LICENSE file for details.

// Permutation polynomial: (34x^2 + x) mod 289
vec4 permuteWorley(vec4 x) {
    return mod((34.0 * x + 1.0) * x, 289.0);
}
vec3 permuteWorley(vec3 x) {
    return mod((34.0 * x + 1.0) * x, 289.0);
}

// Cellular noise, returning F1 and F2 in a vec2.
// Speeded up by using 2x2x2 search window instead of 3x3x3,
// at the expense of some pattern artifacts.
// F2 is often wrong and has sharp discontinuities.
// If you need a good F2, use the slower 3x3x3 version.

float K = 0.142857142857;// 1/7
float Ko = 0.428571428571;// 1/2-K/2
float K2 = 0.020408163265306;// 1/(7*7)
float Kz = 0.166666666667;// 1/6
float Kzo = 0.416666666667;// 1/2-1/6*2

float worley(vec3 P) {
    vec3 Pi = mod(floor(P), 289.0);
    vec3 Pf = fract(P);
    vec4 Pfx = Pf.x + vec4(0.0, -1.0, 0.0, -1.0);
    vec4 Pfy = Pf.y + vec4(0.0, 0.0, -1.0, -1.0);
    vec4 p = permuteWorley(Pi.x + vec4(0.0, 1.0, 0.0, 1.0));
    p = permuteWorley(p + Pi.y + vec4(0.0, 0.0, 1.0, 1.0));
    vec4 p1 = permuteWorley(p + Pi.z);// z+0
    vec4 p2 = permuteWorley(p + Pi.z + vec4(1.0));// z+1
    vec4 ox1 = fract(p1*K) - Ko;
    vec4 oy1 = mod(floor(p1*K), 7.0)*K - Ko;
    vec4 oz1 = floor(p1*K2)*Kz - Kzo;// p1 < 289 guaranteed
    vec4 ox2 = fract(p2*K) - Ko;
    vec4 oy2 = mod(floor(p2*K), 7.0)*K - Ko;
    vec4 oz2 = floor(p2*K2)*Kz - Kzo;
    vec4 dx1 = Pfx + ox1;
    vec4 dy1 = Pfy + oy1;
    vec4 dz1 = Pf.z + oz1;
    vec4 dx2 = Pfx + ox2;
    vec4 dy2 = Pfy + oy2;
    vec4 dz2 = Pf.z - 1.0 + oz2;
    vec4 d1 = dx1 * dx1 + dy1 * dy1 + dz1 * dz1;// z+0
    vec4 d2 = dx2 * dx2 + dy2 * dy2 + dz2 * dz2;// z+1

    // Sort out the two smallest distances (F1, F2)
    // Cheat and sort out only F1
    d1 = min(d1, d2);
    d1.xy = min(d1.xy, d1.wz);
    d1.x = min(d1.x, d1.y);
    return sqrt(d1.x);
}

float completeWorley(vec3 p, int nbOctaves, float decay, float lacunarity) {
    float totalAmplitude = 0.0;
    float value = 0.0;
    for (int i = 0; i < nbOctaves; ++i) {
        totalAmplitude += 1.0 / pow(decay, float(i));
        vec3 samplePoint = p * pow(lacunarity, float(i));
        value += worley(samplePoint) / pow(decay, float(i));
    }
    return value / totalAmplitude;
}