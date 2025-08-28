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


@group(0) @binding(0) var output_texture: texture_storage_3d<rgba8unorm, write>;

// Cell size in *voxels*. For perfect seamless tiling, each texture dimension
// should be an exact multiple of CELL_SIZE.
override CELL_SIZE: u32 = 32u;

// Optional jitter of feature positions inside each cell in [0,1].
override JITTER: f32 = 1.0;

fn positive_modulo(a: i32, b: i32) -> i32 {
    var r = a % b;
    if (r < 0) { r = r + b; }
    return r;
}

// A small 3D integer hash -> [0,1) floats. Deterministic and reasonably decorrelated.
fn rng3(seed: vec3<u32>) -> vec3<f32> {
    var v = seed;
    v = v * 1664525u + 1013904223u;
    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;
    v ^= (v >> vec3<u32>(16u));
    v = v * 22695477u + 1u;
    // Map to [0,1)
    let k = 1.0 / 4294967296.0;
    return vec3<f32>(v) * k;
}

// Computes 3D Worley noise (F1 distance) for a given position and grid parameters.
// Returns the normalized distance to the nearest feature point.
fn worley3d(position: vec3<f32>, cellSize: u32, jitter: f32, tileCells: vec3<i32>) -> f32 {
    let cellSize3 = vec3<u32>(cellSize);
    
    // Current cell (integer) and local position within the cell [0,1)^3.
    let cell = vec3<i32>(position / vec3<f32>(cellSize3));
    let p_local = fract(position / vec3<f32>(cellSize3));

    var min_d2: f32 = 1e30;

    // Examine 27 neighboring cells around the current cell.
    for (var dz: i32 = -1; dz <= 1; dz = dz + 1) {
        for (var dy: i32 = -1; dy <= 1; dy = dy + 1) {
            for (var dx: i32 = -1; dx <= 1; dx = dx + 1) {
                let offset = vec3<i32>(dx, dy, dz);
                let neighbor_cell = cell + offset;

                // Wrap only for hashing (so randomness repeats across texture bounds).
                let wrap_cell_u = vec3<u32>(
                    u32(positive_modulo(neighbor_cell.x, tileCells.x)),
                    u32(positive_modulo(neighbor_cell.y, tileCells.y)),
                    u32(positive_modulo(neighbor_cell.z, tileCells.z))
                );

                // Feature point inside the neighbor cell in [0,1)^3 with optional jitter.
                let r = rng3(wrap_cell_u);
                // Pure Voronoi uses full-range [0,1) positions. jitter < 1.0 pulls toward the cell center.
                let feature_local = mix(vec3<f32>(0.5), r, jitter);

                // Relative vector from current position's local position to the feature (in cell units).
                let rel = vec3<f32>(offset) + feature_local - p_local;

                let d2 = dot(rel, rel);
                if (d2 < min_d2) {
                    min_d2 = d2;
                }
            }
        }
    }

    // Normalize by sqrt(3) (max possible nearest distance in unit cube neighborhood).
    let inv_sqrt3 = 0.5773502691896258; // 1/sqrt(3)
    return clamp(sqrt(min_d2) * inv_sqrt3, 0.0, 1.0);
}

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) global_invocation_id: vec3<u32>) {
    let dims = textureDimensions(output_texture);
    if (any(global_invocation_id >= dims)) { 
        return; 
    }

    // Derived grid info.
    let cellSize = max(CELL_SIZE, 1u);

    // Number of cells along each axis (>=1). Seamless period == dims if dims % CELL_SIZE == 0.
    let tileCellsU = max(dims / vec3<u32>(cellSize), vec3<u32>(1u));
    let tileCellsI = vec3<i32>(tileCellsU);

    // Compute worley noise at different frequencies for each channel
    let position = vec3<f32>(global_invocation_id);
    
    // Red channel: base frequency (cellSize)
    let f1_red = worley3d(position, cellSize, JITTER, tileCellsI);
    
    // Green channel: 2x frequency (cellSize/2)
    let cellSize2 = max(cellSize / 2u, 1u);
    let tileCells2 = max(dims / vec3<u32>(cellSize2), vec3<u32>(1u));
    let f1_green = worley3d(position, cellSize2, JITTER, vec3<i32>(tileCells2));
    
    // Blue channel: 4x frequency (cellSize/4)
    let cellSize4 = max(cellSize / 4u, 1u);
    let tileCells4 = max(dims / vec3<u32>(cellSize4), vec3<u32>(1u));
    let f1_blue = worley3d(position, cellSize4, JITTER, vec3<i32>(tileCells4));

    // Store different frequencies in RGB channels
    let c = vec4<f32>(f1_red, f1_green, f1_blue, 1.0);
    textureStore(output_texture, vec3<i32>(global_invocation_id), c);
}
