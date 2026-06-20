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

uniform float mandelbulb_power;

vec2 raymarchedBodyDistanceData(vec3 position) {
    const int mandelbrotSteps = 15;

    float power = mandelbulb_power + 4.0 * sin(elapsedSeconds * 0.1);
    vec3 z = position;
    float dr = 1.0;
    float r = 0.0;

    for (int i = 0; i < mandelbrotSteps; i++) {
        r = length(z);
        if (r > 1.5) {
            break;
        }

        float theta = acos(z.z / r);
        float phi = atan(z.y, z.x);
        dr = pow(r, power - 1.0) * power * dr + 1.0;

        float zr = pow(r, power);
        theta *= power;
        phi *= power;

        z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
        z += position;
    }

    float distance = 0.5 * log(r) * r / dr;
    float colorIndex = 50.0 * pow(dr, 0.128 / float(RAYMARCHED_BODY_MARCHING_ITERATIONS));

    return vec2(distance, colorIndex);
}

float raymarchedBodyInverseScaling() {
    return 2.0 / (object_radius * object_scaling_determinant);
}
