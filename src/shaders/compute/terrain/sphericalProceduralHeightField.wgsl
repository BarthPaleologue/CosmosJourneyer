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
    distance_to_center: f32,
    up_direction: vec3<f32>,
};

struct TerrainModel {
    seed: f32,
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
@group(0) @binding(2) var<uniform> terrain_model: TerrainModel;

#include "../utils/pi.wgsl";

#include "../utils/remap.wgsl";

#include "../noise/erosionNoise3D.wgsl";

#include "./getVertexPositionOnCube.wgsl";

#include "./mapCubeToUnitSphere.wgsl";

#include "../noise/voronoiNoise3D.wgsl";

#include "../noise/craterNoise3D.wgsl";

#include "../utils/hash31.wgsl";

#include "../utils/smootherstep.wgsl";

fn gradient_noise_3d_fbm(p: vec3<f32>, octave_count: u32) -> f32 {
    var sample_position = p;
    var octave_amplitude = 1.0;
    var total_amplitude = 0.0;
    var result = 0.0;
    for(var i = 0u; i < octave_count; i+=1u) {
        result += gradient_noise_3d(sample_position).x * octave_amplitude;
        total_amplitude += octave_amplitude;

        sample_position *= 2.0;
        octave_amplitude /= 2.0;
    }

    return result / total_amplitude;
}

fn planet_height_field(p: vec3<f32>, terrain_model: TerrainModel) -> f32 {
    let noise_sampling_point = p + (hash31(terrain_model.seed) - 0.5) * 1e8;

    let continent_noise = gradient_noise_3d_fbm(noise_sampling_point / 3000e3, 10);

    let fjord_noise = abs(gradient_noise_3d_fbm(noise_sampling_point / 600e3, 3));

    let mountain_noise = mountain(noise_sampling_point * 0.0001, normalize(p), terrain_model.mountain_erosion);

    let mountain_mask = 0.05 + 0.95 * smoothstep(0.5, 0.6, remap(gradient_noise_3d_fbm(noise_sampling_point / 1000e3  + gradient_noise_3d(noise_sampling_point / 1000e3).yzw, 5), -1.0, 1.0, 0.0, 1.0));

    let terrace_mask = smoothstep(0.4, 0.6, remap(gradient_noise_3d(noise_sampling_point / 2000e3).x, -1.0, 1.0, 0.0, 1.0));

    let terrace_height_variation = gradient_noise_3d_fbm(noise_sampling_point / 5e3, 3);

    let crater_noise = crater_noise_3d_fbm(noise_sampling_point / 500e3, terrain_model.craters_sparsity, terrain_model.craters_octave_count, 2.0, 1.3);

    let continent_mask = remap(continent_noise, -1.0, 1.0, 0.0, 1.0);

    let continental_crust_elevation = terrain_model.continental_crust_elevation;

    let ocean_threshold = invert_noise_threshold(1.0 - terrain_model.continental_crust_fraction);

    let continent_smoothness = 0.01;

    let continent_sharp_mask = smoothstep(ocean_threshold - continent_smoothness, ocean_threshold + continent_smoothness, continent_mask);

    let fjord_penetration = 0.05;

    let continent_fjord_mask = continent_sharp_mask * (1.0 - smootherstep(ocean_threshold, ocean_threshold + fjord_penetration, continent_mask));

    let fjord_width_threshold = 0.03;

    let fjord_noise_sharpened = smoothstep(0.0, fjord_width_threshold * remap(continent_fjord_mask, 0.0, 1.0, 0.3, 1.0), fjord_noise);

    let fjord_elevation = (terrain_model.continental_crust_elevation + terrain_model.mountain_elevation) * remap(fjord_noise_sharpened, 0.0, 1.0, -1.0, 0.0) * continent_fjord_mask;
    
    let mountain_elevation = terrain_model.mountain_elevation * mountain_noise * continent_sharp_mask * mountain_mask;

    let terrace_height = 5e3 + terrace_height_variation * 2e3;

    let terrace_elevation = terrain_model.mountain_terrace_elevation * smoothstep(terrace_height - 10.0, terrace_height + 10.0, mountain_elevation) * terrace_mask;

    let continent_elevation = continental_crust_elevation * clamp(continent_sharp_mask + continent_mask, 0.0, 1.0);

    let craters_elevation = 7e3 * (crater_noise - 1.0);

    return continent_elevation + fjord_elevation + mountain_elevation + terrace_elevation + craters_elevation;
}

@compute @workgroup_size(16,16,1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x >= chunk.row_vertex_count || id.y >= chunk.row_vertex_count) { 
        return;
    }

    let vertex_offset_01 = vec2<f32>(f32(id.x), f32(id.y)) / f32(chunk.row_vertex_count - 1u);
    let vertex_offset_centered = chunk.size * vec2<f32>(0.5 - vertex_offset_01.x, vertex_offset_01.y - 0.5);

    let vertex_position_on_cube = get_vertex_position_on_cube(chunk.position_on_cube, chunk.face_index, vertex_offset_centered);
    let vertex_up = normalize(vertex_position_on_cube);

    let elevation = planet_height_field(vertex_up * chunk.distance_to_center, terrain_model);

    let final_position = (vertex_up - chunk.up_direction) * chunk.distance_to_center + vertex_up * elevation;

    let index: u32 = id.x + id.y * chunk.row_vertex_count;
    positions[index*3u + 0u] = final_position.x;
    positions[index*3u + 1u] = final_position.y;
    positions[index*3u + 2u] = final_position.z;
}