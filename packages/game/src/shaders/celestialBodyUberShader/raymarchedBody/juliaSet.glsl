//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

vec2 raymarchedBodyDistanceData(vec3 position) {
    const int sdfSteps = 15;

    float t = elapsedSeconds / 3.0;
    vec4 c = 0.5 * vec4(cos(t), cos(t * 1.1), cos(t * 2.3), cos(t * 3.1));
    vec4 z = vec4(position, 0.0);
    vec4 nz;

    float md2 = 1.0;
    float mz2 = dot(z, z);

    for (int i = 0; i < sdfSteps; i++) {
        md2 *= 4.0 * mz2;
        nz.x = z.x * z.x - dot(z.yzw, z.yzw);
        nz.yzw = 2.0 * z.x * z.yzw;
        z = nz + c;

        mz2 = dot(z, z);
        if (mz2 > 4.0) {
            break;
        }
    }

    float colorIndex = 50.0 * pow(md2, 0.128 / float(RAYMARCHED_BODY_MARCHING_ITERATIONS));
    float distance = 0.25 * sqrt(mz2 / md2) * log(mz2);

    return vec2(distance, colorIndex);
}

float raymarchedBodyInverseScaling() {
    return 2.0 / (object_radius * object_scaling_determinant);
}
