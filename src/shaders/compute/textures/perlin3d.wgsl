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

// Smooth fade (Perlin quintic)
fn fade(t: f32) -> f32 {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// Hash a lattice point -> unit gradient vector (tiling via wrapped indices)
fn lattice_gradient(gcell: vec3<i32>, tileCells: vec3<i32>) -> vec3<f32> {
    let wrap_cell_u = vec3<u32>(
        u32(positive_modulo(gcell.x, tileCells.x)),
        u32(positive_modulo(gcell.y, tileCells.y)),
        u32(positive_modulo(gcell.z, tileCells.z))
    );

    // Turn hash into approximately uniform direction on the sphere
    var g = rng3(wrap_cell_u) * 2.0 - vec3<f32>(1.0);
    let len2 = max(dot(g, g), 1e-10);
    g = g * inverseSqrt(len2);
    // Rare degenerate cases get normalized above; return unit vector.
    return g;
}

// Seamless Perlin noise in [0,1], period-controlled by tileCells (in lattice-cell units).
fn perlin3d(position: vec3<f32>, cellSize: u32, tileCells: vec3<i32>) -> f32 {
    let cellSize3 = vec3<u32>(cellSize);

    // Current lattice cell and local position in [0,1)^3
    let cell = vec3<i32>(position / vec3<f32>(cellSize3));
    let p_local = fract(position / vec3<f32>(cellSize3));

    // Corner gradients
    let g000 = lattice_gradient(cell + vec3<i32>(0,0,0), tileCells);
    let g100 = lattice_gradient(cell + vec3<i32>(1,0,0), tileCells);
    let g010 = lattice_gradient(cell + vec3<i32>(0,1,0), tileCells);
    let g110 = lattice_gradient(cell + vec3<i32>(1,1,0), tileCells);
    let g001 = lattice_gradient(cell + vec3<i32>(0,0,1), tileCells);
    let g101 = lattice_gradient(cell + vec3<i32>(1,0,1), tileCells);
    let g011 = lattice_gradient(cell + vec3<i32>(0,1,1), tileCells);
    let g111 = lattice_gradient(cell + vec3<i32>(1,1,1), tileCells);

    // Corner displacement vectors
    let d000 = p_local - vec3<f32>(0.0, 0.0, 0.0);
    let d100 = p_local - vec3<f32>(1.0, 0.0, 0.0);
    let d010 = p_local - vec3<f32>(0.0, 1.0, 0.0);
    let d110 = p_local - vec3<f32>(1.0, 1.0, 0.0);
    let d001 = p_local - vec3<f32>(0.0, 0.0, 1.0);
    let d101 = p_local - vec3<f32>(1.0, 0.0, 1.0);
    let d011 = p_local - vec3<f32>(0.0, 1.0, 1.0);
    let d111 = p_local - vec3<f32>(1.0, 1.0, 1.0);

    // Dot products
    let n000 = dot(g000, d000);
    let n100 = dot(g100, d100);
    let n010 = dot(g010, d010);
    let n110 = dot(g110, d110);
    let n001 = dot(g001, d001);
    let n101 = dot(g101, d101);
    let n011 = dot(g011, d011);
    let n111 = dot(g111, d111);

    // Fade
    let u = fade(p_local.x);
    let v = fade(p_local.y);
    let w = fade(p_local.z);

    // Trilinear interpolation with fade
    let nx00 = mix(n000, n100, u);
    let nx10 = mix(n010, n110, u);
    let nx01 = mix(n001, n101, u);
    let nx11 = mix(n011, n111, u);

    let nxy0 = mix(nx00, nx10, v);
    let nxy1 = mix(nx01, nx11, v);

    let n = mix(nxy0, nxy1, w); // in ~[-1,1]

    // Normalize to [0,1]
    return clamp(n * 0.5 + 0.5, 0.0, 1.0);
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

    // Sample Perlin at different frequencies for each channel
    let position = vec3<f32>(global_invocation_id);

    // Red channel: base frequency (cellSize)
    let f1_red = perlin3d(position, cellSize, tileCellsI);

    // Green channel: 2x frequency (cellSize/2)
    let cellSize2 = max(cellSize / 2u, 1u);
    let tileCells2 = max(dims / vec3<u32>(cellSize2), vec3<u32>(1u));
    let f1_green = perlin3d(position, cellSize2, vec3<i32>(tileCells2));

    // Blue channel: 4x frequency (cellSize/4)
    let cellSize4 = max(cellSize / 4u, 1u);
    let tileCells4 = max(dims / vec3<u32>(cellSize4), vec3<u32>(1u));
    let f1_blue = perlin3d(position, cellSize4, vec3<i32>(tileCells4));

    // Store different frequencies in RGB channels
    let c = vec4<f32>(f1_red, f1_green, f1_blue, 1.0);
    textureStore(output_texture, vec3<i32>(global_invocation_id), c);
}
