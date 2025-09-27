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

fn crater_noise_3d(p : vec3f, sparsity: f32) -> f32 {
    // modulate the crater size with some noise
    let shrink_factor = 4.0 * remap(gradient_noise_3d(p * 0.1).x, -1.0, 1.0, 0.2, 1.8);

    // break the perfect circle with some noise for a more natural look
    let noisy_boundary_factor = 1.0 + gradient_noise_3d_fbm(p * 4.0, 3) * 0.8;

    // normalized distance to the center of the crater (with noise modulations)
    let v = voronoi_noise_3d(p / sparsity) * pow(sparsity, 2.0) * shrink_factor * noisy_boundary_factor;

    let central_hill = 0.8 * exp(-sqrt(v) * 10.0);

    let border_slope = smoothstep(0.5, 0.7, v);

    let slope_bump = 10.0 * pow(1.0 - smoothstep(0.0, 1.0, v), 2.0) + 1.0;

    return central_hill + border_slope * slope_bump;
}

fn crater_noise_3d_fbm(p: vec3<f32>, sparsity: f32, octave_count: u32, lacunarity: f32, decay: f32) -> f32 {
    var sample_position = p;
    var octave_amplitude = 1.0;
    var total_amplitude = 0.0;
    var result = 0.0;
    for(var i = 0u; i < octave_count; i+=1u) {
        result += crater_noise_3d(sample_position, sparsity) * octave_amplitude;
        total_amplitude += octave_amplitude;

        sample_position *= lacunarity;
        octave_amplitude /= decay;
    }

    return result / total_amplitude;
}
