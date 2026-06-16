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

uniform float mandelbox_mr2;
uniform float mandelbox_spread;

vec2 raymarchedBodyDistanceData(vec3 position) {
    const int iterations = 10;
    const float scale = 3.0;

    float mr2 = mandelbox_mr2;
    vec4 scaleVec = vec4(scale, scale, scale, abs(scale)) / mr2;
    float c1 = abs(scale - 1.0);
    float c2 = pow(abs(scale), float(1 - iterations));

    vec4 p = vec4(position.xyz, 1.0);
    vec4 p0 = vec4(position.xyz, 1.0);
    for (int i = 0; i < iterations; i++) {
        p.xyz = clamp(p.xyz, -1.0, 1.0) * 2.0 - p.xyz;
        float r2 = dot(p.xyz, p.xyz);
        p.xyzw *= clamp(max(mr2 / r2, mr2), 0.0, 1.0);
        p.xyzw = p * scaleVec + p0 * mandelbox_spread;
    }

    return vec2((length(p.xyz) - c1) / p.w - c2, 0.0);
}

float raymarchedBodyInverseScaling() {
    const float scale = 3.0;
    return 3.0 * scale / (object_radius * object_scaling_determinant);
}
