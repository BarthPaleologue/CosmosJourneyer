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

/**
 * Maps a position on the cube to a point on the unit sphere.
 * @see https://catlikecoding.com/unity/tutorials/cube-sphere/
 */
fn map_cube_to_unit_sphere(position_on_cube: vec3<f32>) -> vec3<f32> {
    /*let p = position_on_cube / (params.sphere_radius);
    let x2 = p.x*p.x;
    let y2 = p.y*p.y;
    let z2 = p.z*p.z;

    return vec3(
        p.x * sqrt(1.0 - 0.5*(y2+z2) + (y2*z2)/3.0),
        p.y * sqrt(1.0 - 0.5*(z2+x2) + (z2*x2)/3.0),
        p.z * sqrt(1.0 - 0.5*(x2+y2) + (x2*y2)/3.0)
    );*/

    return normalize(position_on_cube);
}