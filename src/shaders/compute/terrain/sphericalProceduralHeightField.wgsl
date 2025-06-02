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

fn get_vertex_position(chunk_position_on_cube: vec3<f32>, direction: u32, x: f32, y: f32) -> vec3<f32> {
    switch (direction) {
        case 0: { // UP
            return chunk_position_on_cube + vec3<f32>(x, 0.0, y);
        }
        case 1: { // DOWN
            return chunk_position_on_cube + vec3<f32>(y, 0.0, x);
        }
        case 2: { // LEFT
            return chunk_position_on_cube + vec3<f32>(0.0, x, y);
        }
        case 3: { // RIGHT
            return chunk_position_on_cube + vec3<f32>(0.0, y, x);
        }
        case 4: { // FORWARD
            return chunk_position_on_cube + vec3<f32>(x, y, 0.0);
        }
        default: { // BACKWARD
            return chunk_position_on_cube + vec3<f32>(y, x, 0.0);
        }
    }
}

@compute @workgroup_size(16,16,1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x >= params.nbVerticesPerRow || id.y >= params.nbVerticesPerRow) { 
        return; 
    }

    let x : f32 = f32(id.x);
    let y : f32 = f32(id.y);

    let index: u32 = id.x + id.y * u32(params.nbVerticesPerRow);

    let vertex_x = params.size * ((x / f32(params.nbVerticesPerRow - 1)) - 0.5);
    let vertex_y = params.size * ((y / f32(params.nbVerticesPerRow - 1)) - 0.5);

    let vertex_position = get_vertex_position(params.chunk_position_on_cube, params.direction, vertex_x, vertex_y);

    let sphere_up = normalize(vertex_position);

    let vertex_position_sphere = sphere_up * params.sphere_radius;

    let chunk_position_on_sphere = normalize(params.chunk_position_on_cube) * params.sphere_radius;

    let elevation = mountain(vertex_position_sphere, sphere_up);

    let final_position = vertex_position_sphere + sphere_up * elevation - chunk_position_on_sphere;

    positions[index * 3 + 0] = final_position.x;
    positions[index * 3 + 1] = final_position.y;
    positions[index * 3 + 2] = final_position.z;

    if(x > 0 && y > 0) {
        let indexIndex = ((id.x - 1) + (id.y - 1) * (params.nbVerticesPerRow - 1)) * 6;

        indices[indexIndex + 0] = index - 1;
        indices[indexIndex + 1] = index;
        indices[indexIndex + 2] = index - params.nbVerticesPerRow - 1;

        indices[indexIndex + 3] = index;
        indices[indexIndex + 4] = index - params.nbVerticesPerRow;
        indices[indexIndex + 5] = index - params.nbVerticesPerRow - 1;
    }
}