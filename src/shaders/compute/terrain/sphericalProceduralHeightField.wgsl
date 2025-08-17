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
    seed: f32,
    continental_crust_elevation : f32,
    continental_crust_fraction: f32,
    mountain_elevation : f32,
    mountain_terrace_elevation : f32,
    craters_octave_count : u32,
    craters_sparsity : f32,
}

@group(0) @binding(0) var<storage, read_write> positions : array<f32>;
@group(0) @binding(1) var<uniform> params : Params;
@group(0) @binding(2) var<uniform> terrain_model : TerrainModel;

#include "../utils/pi.wgsl";

#include "../utils/remap.wgsl";

#include "../noise/erosionNoise3D.wgsl";

#include "./getVertexPositionOnCube.wgsl";

#include "./mapCubeToUnitSphere.wgsl";

#include "../noise/voronoiNoise3D.wgsl";

#include "../utils/hash31.wgsl";

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

fn craters(p : vec3f, sparsity: f32) -> f32 {
    // modulate the crater size with some noise
    let shrink_factor = 4.0 * remap(gradient_noise_3d(p * 0.1).x, -1.0, 1.0, 0.2, 1.8);

    // break the perfect circle with some noise for a more natural look
    let noisy_boundary_factor = 1.0 + gradient_noise_3d_fbm(p * 4.0, 3) * 0.8;

    // normalized distance to the center of the crater (with noise modulations)
    let v = voronoi_noise_3d(p / sparsity) * pow(sparsity, 2.0) * shrink_factor * noisy_boundary_factor;

    let central_hill = 0.8 * exp(-sqrt(v) * 10.0);

    let border_slope = smoothstep(0.5, 0.7, v);

    let slope_bump = 10.0 * pow(1.0 - smoothstep(0.0, 1.0, v), 2.0) + 1.0;

    return remap(central_hill + border_slope * slope_bump, 0.0, 1.0, -1.0, 0.0);
}

fn craters_fbm(p: vec3<f32>, sparsity: f32, octave_count: u32, lacunarity: f32, decay: f32) -> f32 {
    var sample_position = p;
    var octave_amplitude = 1.0;
    var total_amplitude = 0.0;
    var result = 0.0;
    for(var i = 0u; i < octave_count; i+=1u) {
        result += craters(sample_position, sparsity) * octave_amplitude;
        total_amplitude += octave_amplitude;

        sample_position *= lacunarity;
        octave_amplitude /= decay;
    }

    return result / total_amplitude;
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

    let vertex_position_on_sphere = sphere_up * params.sphere_radius;

    let noise_sampling_point = vertex_position_on_sphere + (hash31(terrain_model.seed) - 0.5) * 1e8;

    let continent_noise = gradient_noise_3d_fbm(noise_sampling_point / 3000e3, 10);

    let fjord_noise = abs(gradient_noise_3d_fbm(noise_sampling_point / 600e3, 3));

    let mountain_noise = mountain(noise_sampling_point * 0.0001, sphere_up);

    let mountain_mask = 0.05 + 0.95 * smoothstep(0.5, 0.6, remap(gradient_noise_3d_fbm(noise_sampling_point / 1000e3  + gradient_noise_3d(noise_sampling_point / 1000e3).yzw, 5), -1.0, 1.0, 0.0, 1.0));

    let terrace_mask = smoothstep(0.4, 0.6, remap(gradient_noise_3d(noise_sampling_point / 2000e3).x, -1.0, 1.0, 0.0, 1.0));

    let terrace_height_variation = gradient_noise_3d_fbm(noise_sampling_point / 5e3, 3);

    let continent_mask = remap(continent_noise, -1.0, 1.0, 0.0, 1.0);

    let continental_crust_elevation = terrain_model.continental_crust_elevation;

    let ocean_threshold = invert_noise_threshold(1.0 - terrain_model.continental_crust_fraction);

    let continent_smoothness = 0.01;

    let continent_sharp_mask = smoothstep(ocean_threshold - continent_smoothness, ocean_threshold + continent_smoothness, continent_mask);

    let fjord_penetration = 0.05;

    let continent_fjord_mask = continent_sharp_mask * (1.0 - smoothstep(ocean_threshold, ocean_threshold + fjord_penetration, continent_mask));

    let fjord_width_threshold = 0.03;

    let fjord_noise_sharpened = smoothstep(0.0, fjord_width_threshold * remap(continent_fjord_mask, 0.0, 1.0, 0.3, 1.0), fjord_noise);

    let fjord_elevation = (terrain_model.continental_crust_elevation + terrain_model.mountain_elevation) * remap(fjord_noise_sharpened, 0.0, 1.0, -1.0, 0.0) * continent_fjord_mask;
    
    let mountain_elevation = terrain_model.mountain_elevation * mountain_noise * continent_sharp_mask * mountain_mask;

    let terrace_elevation = terrain_model.mountain_terrace_elevation * step(5e3 + terrace_height_variation * 2e3, mountain_elevation) * terrace_mask;

    let continent_elevation = continental_crust_elevation * clamp(continent_sharp_mask + continent_mask, 0.0, 1.0);

    let craters_elevation = 7e3 * craters_fbm(noise_sampling_point / 500e3, terrain_model.craters_sparsity, terrain_model.craters_octave_count, 2.0, 1.3);

    let elevation = continent_elevation + fjord_elevation + mountain_elevation + terrace_elevation + craters_elevation;

    let final_position = vertex_position_on_sphere + sphere_up * elevation - params.chunk_position_on_sphere;

    let index: u32 = id.x + id.y * u32(params.nbVerticesPerRow);
    positions[index * 3 + 0] = final_position.x;
    positions[index * 3 + 1] = final_position.y;
    positions[index * 3 + 2] = final_position.z;
}