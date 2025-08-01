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

#include "../utils/remap.wgsl";

#include "../noise/erosionNoise3D.wgsl";

#include "./getVertexPositionOnCube.wgsl";

#include "./mapCubeToUnitSphere.wgsl";

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

    let noise_sampling_point = vertex_position_on_sphere;

    let continent_noise = gradient_noise_3d_fbm(noise_sampling_point / 3000e3, 7);

    let fjord_noise = abs(gradient_noise_3d_fbm(noise_sampling_point / 600e3, 3));

    let mountain_noise = mountain(noise_sampling_point * 0.0001, sphere_up);

    let mountain_mask = smoothstep(0.5, 0.6, remap(gradient_noise_3d_fbm(noise_sampling_point / 1000e3  + gradient_noise_3d(noise_sampling_point / 1000e3).yzw, 5), -1.0, 1.0, 0.0, 1.0));

    let terrace_mask = smoothstep(0.4, 0.6, remap(gradient_noise_3d(noise_sampling_point / 2000e3).x, -1.0, 1.0, 0.0, 1.0));

    let continent_mask = remap(continent_noise, -1.0, 1.0, 0.0, 1.0);

    let filling_noise = remap(gradient_noise_3d_fbm(noise_sampling_point / 10e3, 10), -1.0, 1.0, 0.0, 1.0);

    let ocean_depth = 30e3;

    let ocean_threshold = 0.55;

    let continent_smoothness = 0.01;

    let continent_sharp_mask = smoothstep(ocean_threshold - continent_smoothness, ocean_threshold + continent_smoothness, continent_mask);

    let fjord_penetration = 0.06;

    let continent_fjord_mask = continent_sharp_mask * (1.0 - smoothstep(ocean_threshold, ocean_threshold + fjord_penetration, continent_mask));

    let fjord_width_threshold = 0.03;

    let fjord_noise_sharpened = smoothstep(0.0, fjord_width_threshold * remap(continent_fjord_mask, 0.0, 1.0, 0.3, 1.0), fjord_noise);

    let fjord_elevation = ocean_depth * remap(fjord_noise_sharpened, 0.0, 1.0, -1.0, 0.0) * continent_fjord_mask;

    let mountain_elevation = 10e3 * mountain_noise * continent_sharp_mask * mountain_mask;

    let terrace_elevation = 1e3 * step(5e3, mountain_elevation) * terrace_mask;

    let filling_elevation = 700 * filling_noise * continent_sharp_mask;

    let continent_elevation = ocean_depth * clamp(continent_sharp_mask + continent_mask, 0.0, 1.0);

    let elevation = continent_elevation + fjord_elevation + mountain_elevation + terrace_elevation + filling_elevation;

    let final_position = vertex_position_on_sphere + sphere_up * elevation - params.chunk_position_on_sphere;

    let index: u32 = id.x + id.y * u32(params.nbVerticesPerRow);
    positions[index * 3 + 0] = final_position.x;
    positions[index * 3 + 1] = final_position.y;
    positions[index * 3 + 2] = final_position.z;
}