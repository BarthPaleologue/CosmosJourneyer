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

struct Chunk {
    row_vertex_count: u32,
    size: f32,
    face_index: u32,
    position_on_cube: vec3<f32>,
    up_direction: vec3<f32>,
};

struct ProceduralTerrainModel {
    seed: f32,
    radius: f32,
    continental_crust_elevation: f32,
    continental_crust_fraction: f32,
    mountain_elevation: f32,
    mountain_terrace_elevation: f32,
    mountain_erosion: f32,
    craters_octave_count: u32,
    craters_sparsity: f32,
}

@group(0) @binding(0) var<storage, read_write> positions: array<f32>;
@group(0) @binding(1) var<uniform> chunk: Chunk;
@group(0) @binding(2) var<uniform> terrain_model: ProceduralTerrainModel;

#include "../utils/remap.wgsl";

#include "../noise/gradientNoise3D.wgsl";

#include "../noise/erosionNoise3D.wgsl";

#include "../noise/voronoiNoise3D.wgsl";

#include "../noise/craterNoise3D.wgsl";

#include "../utils/hash31.wgsl";

#include "../utils/smootherstep.wgsl";

#include "./heightFields/proceduralPlanet.wgsl";

#include "./getVertexPositionOnCube.wgsl";

#include "./mapCubeToUnitSphere.wgsl";

@compute @workgroup_size(16,16,1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x >= chunk.row_vertex_count || id.y >= chunk.row_vertex_count) { 
        return;
    }

    let vertex_offset_01 = vec2<f32>(f32(id.x), f32(id.y)) / f32(chunk.row_vertex_count - 1u);
    let vertex_offset_centered = chunk.size * vec2<f32>(0.5 - vertex_offset_01.x, vertex_offset_01.y - 0.5);

    let vertex_position_on_cube = get_vertex_position_on_cube(chunk.position_on_cube, chunk.face_index, vertex_offset_centered);
    let vertex_up = normalize(vertex_position_on_cube);

    let elevation = planet_height_field(vertex_up * terrain_model.radius, terrain_model);

    let final_position = (vertex_up - chunk.up_direction) * terrain_model.radius + vertex_up * elevation;

    let index: u32 = id.x + id.y * chunk.row_vertex_count;
    positions[index*3u + 0u] = final_position.x;
    positions[index*3u + 1u] = final_position.y;
    positions[index*3u + 2u] = final_position.z;
}