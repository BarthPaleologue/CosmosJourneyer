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
@group(0) @binding(2) var heightMap : texture_2d<f32>;
@group(0) @binding(3) var heightMapSampler : sampler;

#include "../utils/pi.wgsl";

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

@compute @workgroup_size(16,16,1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x >= params.nbVerticesPerRow || id.y >= params.nbVerticesPerRow) { 
        return; 
    }

    
    let vertex_offset = params.size * ((vec2<f32>(f32(id.x), f32(id.y)) / f32(params.nbVerticesPerRow - 1)) - 0.5);

    let vertex_position_on_cube = get_vertex_position_on_cube(params.chunk_position_on_cube, params.direction, vertex_offset);

    let sphere_up = map_cube_to_unit_sphere(vertex_position_on_cube);
    
    // inverse trigonometric functions to get the height map pixel
    let theta = acos(sphere_up.y);
    let phi = atan2(sphere_up.z, sphere_up.x);
    let u = (phi + PI) / (2.0 * PI);
    let v = (theta) / PI;

    let heightMapSample : vec4<f32> = textureSampleLevel(heightMap, heightMapSampler, vec2<f32>(u, v), 0.0);
    
    let vertex_position_on_sphere = sphere_up * params.sphere_radius;

    let elevation = heightMapSample.r * 22e3;

    let final_position = vertex_position_on_sphere + sphere_up * elevation - params.chunk_position_on_sphere;

    let index: u32 = id.x + id.y * u32(params.nbVerticesPerRow);
    positions[index * 3 + 0] = final_position.x;
    positions[index * 3 + 1] = final_position.y;
    positions[index * 3 + 2] = final_position.z;
}