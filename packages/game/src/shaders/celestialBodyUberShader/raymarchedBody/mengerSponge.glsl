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

float raymarchedBodySdBox(vec3 p, vec3 b) {
    vec3 di = abs(p) - b;
    float mc = max(di.x, max(di.y, di.z));
    return min(mc, length(max(di, 0.0)));
}

vec2 raymarchedBodyDistanceData(vec3 p) {
    float d = raymarchedBodySdBox(p, vec3(1.0));
    float s = 0.5;
    for (int m = 0; m < 7; m++) {
        vec3 a = fract(p * s) - 0.5;
        s *= 3.0;
        vec3 r = abs(1.0 - 6.0 * abs(a));
        float da = max(r.x, r.y);
        float db = max(r.y, r.z);
        float dc = max(r.z, r.x);
        float c = (min(da, min(db, dc)) - 1.0) / (2.0 * s);

        if (c > d) {
            d = c;
        }
    }
    return vec2(d, 0.0);
}

float raymarchedBodyInverseScaling() {
    return 2.0 / (object_radius * object_scaling_determinant);
}
