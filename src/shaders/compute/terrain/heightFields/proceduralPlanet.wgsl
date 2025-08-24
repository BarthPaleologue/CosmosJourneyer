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


fn planet_height_field(p: vec3<f32>, terrain_model: ProceduralTerrainModel) -> f32 {
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

    let continent_sharp_mask = smootherstep(ocean_threshold - continent_smoothness, ocean_threshold + continent_smoothness, continent_mask);

    let fjord_penetration = 0.05;

    let continent_fjord_mask = continent_sharp_mask * (1.0 - smootherstep(ocean_threshold, ocean_threshold + fjord_penetration, continent_mask));

    let fjord_width_threshold = 0.03;

    let fjord_noise_sharpened = smootherstep(0.0, fjord_width_threshold * remap(continent_fjord_mask, 0.0, 1.0, 0.3, 1.0), fjord_noise);

    let fjord_elevation = (terrain_model.continental_crust_elevation + terrain_model.mountain_elevation) * remap(fjord_noise_sharpened, 0.0, 1.0, -1.0, 0.0) * continent_fjord_mask;
    
    let mountain_elevation = terrain_model.mountain_elevation * mountain_noise * continent_sharp_mask * mountain_mask;

    let terrace_height = 5e3 + terrace_height_variation * 2e3;

    let terrace_elevation = terrain_model.mountain_terrace_elevation * smoothstep(terrace_height - 10.0, terrace_height + 10.0, mountain_elevation) * terrace_mask;

    let continent_elevation = continental_crust_elevation * clamp(continent_sharp_mask + continent_mask, 0.0, 1.0);

    let craters_elevation = 10e3 * (crater_noise - 1.0);

    return continent_elevation + fjord_elevation + mountain_elevation + terrace_elevation + craters_elevation;
}