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

vec2 raymarchedBodyDistanceData(vec3 z) {
    const float yOffset = 0.3;
    const vec3 va = vec3(0.0, yOffset + 0.57735, 0.0);
    const vec3 vb = vec3(0.0, -1.0 + yOffset, 1.15470);
    const vec3 vc = vec3(1.0, -1.0 + yOffset, -0.57735);
    const vec3 vd = vec3(-1.0, -1.0 + yOffset, -0.57735);

    vec3 p = z;
    float s = 1.0;
    float r = 1.0;
    float dm;
    for (int i = 0; i < 9; i++) {
        vec3 v;
        float d;
        d = dot(p - va, p - va); { v = va; dm = d; }
        d = dot(p - vb, p - vb); if (d < dm) { v = vb; dm = d; }
        d = dot(p - vc, p - vc); if (d < dm) { v = vc; dm = d; }
        d = dot(p - vd, p - vd); if (d < dm) { v = vd; dm = d; }
        p = v + 2.0 * (p - v);
        r *= 2.0;
        s *= 4.0;
    }

    return vec2((sqrt(dm) - 1.0) / r, 0.0);
}

float raymarchedBodyInverseScaling() {
    return 2.0 / (object_radius * object_scaling_determinant);
}
