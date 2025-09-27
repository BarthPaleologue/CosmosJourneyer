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

struct TerrainModel {
    min_height: f32,
    max_height: f32,
}

@group(0) @binding(0) var<storage, read_write> positions : array<f32>;
@group(0) @binding(1) var<uniform> params : Params;
@group(0) @binding(2) var heightMapSampler : sampler;
@group(0) @binding(3) var<uniform> terrainModel : TerrainModel;

@group(1) @binding(0) var heightMap_0_0 : texture_2d<f32>;
@group(1) @binding(1) var heightMap_0_1 : texture_2d<f32>;
@group(1) @binding(2) var heightMap_0_2 : texture_2d<f32>;
@group(1) @binding(3) var heightMap_0_3 : texture_2d<f32>;
@group(1) @binding(4) var heightMap_1_0 : texture_2d<f32>;
@group(1) @binding(5) var heightMap_1_1 : texture_2d<f32>;
@group(1) @binding(6) var heightMap_1_2 : texture_2d<f32>;
@group(1) @binding(7) var heightMap_1_3 : texture_2d<f32>;

#include "../utils/pi.wgsl";

#include "./getVertexPositionOnCube.wgsl";

#include "./mapCubeToUnitSphere.wgsl";

#include "../utils/remap.wgsl";

#include "../utils/sphereToUv.wgsl";

fn sample_height_map(uv: vec2<f32>) -> vec4<f32> {
    let uv_scaled = uv * vec2<f32>(4.0, 2.0); // Scale UV to match the 2x4 height map layout
    
    let tile_x = floor(uv_scaled.x);
    let tile_y = floor(uv_scaled.y);
    let tile_index = u32(tile_x) + u32(tile_y) * 4u; // 4 tiles in the x direction, 2 in the y direction

    let uv_in_tile = fract(uv_scaled);

    switch (tile_index) {
        case 0: {
            return textureSampleLevel(heightMap_0_0, heightMapSampler, uv_in_tile, 0.0);
        }
        case 1: {
            return textureSampleLevel(heightMap_0_1, heightMapSampler, uv_in_tile, 0.0);
        }
        case 2: {
            return textureSampleLevel(heightMap_0_2, heightMapSampler, uv_in_tile, 0.0);
        }
        case 3: {
            return textureSampleLevel(heightMap_0_3, heightMapSampler, uv_in_tile, 0.0);
        }
        case 4: {
            return textureSampleLevel(heightMap_1_0, heightMapSampler, uv_in_tile, 0.0);
        }
        case 5: {
            return textureSampleLevel(heightMap_1_1, heightMapSampler, uv_in_tile, 0.0);
        }
        case 6: {
            return textureSampleLevel(heightMap_1_2, heightMapSampler, uv_in_tile, 0.0);
        }
        default: { // case 7
            return textureSampleLevel(heightMap_1_3, heightMapSampler, uv_in_tile, 0.0);
        }
    }
}

@compute @workgroup_size(16,16,1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x >= params.nbVerticesPerRow || id.y >= params.nbVerticesPerRow) { 
        return; 
    }

    let vertex_offset_01 = vec2<f32>(f32(id.x), f32(id.y)) / f32(params.nbVerticesPerRow - 1);
    let vertex_offset_centered = params.size * vec2<f32>(0.5 - vertex_offset_01.x, vertex_offset_01.y - 0.5);

    let vertex_position_on_cube = get_vertex_position_on_cube(params.chunk_position_on_cube, params.direction, vertex_offset_centered);

    let sphere_up = map_cube_to_unit_sphere(vertex_position_on_cube);
    
    var uv = sphere_to_uv(sphere_up);
    uv.x = 1.0 - uv.x; // Flip the x coordinate to match the texture coordinates

    let heightMapSample : vec4<f32> = sample_height_map(uv);
    
    let vertex_position_on_sphere = sphere_up * params.sphere_radius;

    let elevation = remap(heightMapSample.r, 0.0, 1.0, terrainModel.min_height, terrainModel.max_height);

    let final_position = vertex_position_on_sphere + sphere_up * elevation - params.chunk_position_on_sphere;

    let index: u32 = id.x + id.y * u32(params.nbVerticesPerRow);
    positions[index * 3 + 0] = final_position.x;
    positions[index * 3 + 1] = final_position.y;
    positions[index * 3 + 2] = final_position.z;
}