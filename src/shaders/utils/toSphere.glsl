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

#define PI 3.1415926535897932384626433832795

// Uv range: [0, 1]
vec3 toSphere(in vec2 uv)
{
    float theta = 2.0 * PI * uv.x + - PI / 2.0;
    float phi = PI * uv.y;

    return vec3(
        cos(theta) * sin(phi),
        cos(phi),
        sin(theta) * sin(phi)
    );
}