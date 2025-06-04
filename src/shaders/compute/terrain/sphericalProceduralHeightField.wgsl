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
};

@group(0) @binding(0) var<storage, read_write> positions : array<f32>;
@group(0) @binding(1) var<storage, read_write> indices : array<u32>;
@group(0) @binding(2) var<uniform> params : Params;

#include "../utils/pi.wgsl";

#include "../noise/gradientNoise2D.wgsl";

#include "../noise/erosionNoise3D.wgsl";

fn get_vertex_position_on_cube(chunk_position_on_cube: vec3<f32>, direction: u32, offset: vec2<f32>) -> vec3<f32> {
    switch (direction) {
        case 0: { // UP
            return chunk_position_on_cube + vec3<f32>(offset.x, 0.0, offset.y);
        }
        case 1: { // DOWN
            return chunk_position_on_cube + vec3<f32>(offset.y, 0.0, offset.x);
        }
        case 2: { // LEFT
            return chunk_position_on_cube + vec3<f32>(0.0, offset.x, offset.y);
        }
        case 3: { // RIGHT
            return chunk_position_on_cube + vec3<f32>(0.0, offset.y, offset.x);
        }
        case 4: { // FORWARD
            return chunk_position_on_cube + vec3<f32>(offset.x, offset.y, 0.0);
        }
        default: { // BACKWARD
            return chunk_position_on_cube + vec3<f32>(offset.y, offset.x, 0.0);
        }
    }
}

@compute @workgroup_size(16,16,1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x >= params.nbVerticesPerRow || id.y >= params.nbVerticesPerRow) { 
        return; 
    }

    // this one can be precomputed
    let chunk_position_on_sphere = normalize(params.chunk_position_on_cube) * params.sphere_radius;

    let vertex_offset = params.size * ((vec2<f32>(f32(id.x), f32(id.y)) / f32(params.nbVerticesPerRow - 1)) - 0.5);

    let vertex_position_on_cube = get_vertex_position_on_cube(params.chunk_position_on_cube, params.direction, vertex_offset);

    let sphere_up = normalize(vertex_position_on_cube);

    let vertex_position_on_sphere = sphere_up * params.sphere_radius;

    let elevation = 7e3 * mountain(vertex_position_on_sphere * 0.0001, sphere_up);

    let final_position = vertex_position_on_sphere + sphere_up * elevation - chunk_position_on_sphere;

    let index: u32 = id.x + id.y * u32(params.nbVerticesPerRow);
    positions[index * 3 + 0] = final_position.x;
    positions[index * 3 + 1] = final_position.y;
    positions[index * 3 + 2] = final_position.z;

    if(id.x > 0 && id.y > 0) {
        let indexIndex = ((id.x - 1) + (id.y - 1) * (params.nbVerticesPerRow - 1)) * 6;

        indices[indexIndex + 0] = index - 1;
        indices[indexIndex + 1] = index;
        indices[indexIndex + 2] = index - params.nbVerticesPerRow - 1;

        indices[indexIndex + 3] = index;
        indices[indexIndex + 4] = index - params.nbVerticesPerRow;
        indices[indexIndex + 5] = index - params.nbVerticesPerRow - 1;
    }
}