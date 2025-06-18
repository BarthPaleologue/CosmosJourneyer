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

struct Params {
    nbVerticesPerRow : u32,
    size : f32,
    direction: u32,
    chunk_position_on_cube : vec3<f32>,
    sphere_radius : f32,
    chunk_position_on_sphere : vec3<f32>,
};

@group(0) @binding(0) var<storage, read_write> positions : array<f32>;
@group(0) @binding(1) var<uniform> params : Params;

#include "../utils/pi.wgsl";

#include "../noise/gradientNoise2D.wgsl";

#include "../noise/erosionNoise3D.wgsl";

#include "./getVertexPositionOnCube.wgsl";

#include "./mapCubeToUnitSphere.wgsl";

@compute @workgroup_size(16,16,1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x >= params.nbVerticesPerRow || id.y >= params.nbVerticesPerRow) { 
        return; 
    }
    
    let vertex_offset = params.size * ((vec2<f32>(f32(id.x), f32(id.y)) / f32(params.nbVerticesPerRow - 1)) - 0.5);

    let vertex_position_on_cube = get_vertex_position_on_cube(params.chunk_position_on_cube, params.direction, vertex_offset);

    let sphere_up = map_cube_to_unit_sphere(vertex_position_on_cube);

    let vertex_position_on_sphere = sphere_up * params.sphere_radius;

    let elevation = 7e3 * mountain(vertex_position_on_sphere * 0.0001, sphere_up);

    let final_position = vertex_position_on_sphere + sphere_up * elevation - params.chunk_position_on_sphere;

    let index: u32 = id.x + id.y * u32(params.nbVerticesPerRow);
    positions[index * 3 + 0] = final_position.x;
    positions[index * 3 + 1] = final_position.y;
    positions[index * 3 + 2] = final_position.z;
}