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
    row_vertex_count : u32,
};

@group(0) @binding(0) var<storage, read> positions: array<f32>; // x,y,z triples
@group(0) @binding(1) var<storage, read_write> normals: array<f32>; // x,y,z triples
@group(0) @binding(2) var<uniform> params: Params;

// helper to load a position at grid (i,j)
fn load_position(i: u32, j: u32, row_vertex_count: u32) -> vec3<f32> {
    let iidx = (i + j * row_vertex_count) * 3u;
    return vec3<f32>(
        positions[iidx + 0u],
        positions[iidx + 1u],
        positions[iidx + 2u]
    );
}

@compute @workgroup_size(16,16)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let x = id.x;
    let y = id.y;
    let row_vertex_count = params.row_vertex_count;
    if (x >= row_vertex_count || y >= row_vertex_count) {
        return;
    }

    // linear index of this vertex
    let idx = x + y * row_vertex_count;

    // get neighbor coords with clamped forward/backward differences
    let x_left = select(x - 1u, 0u, x == 0u);
    let x_right = min(x + 1u, row_vertex_count - 1u);
    let y_down = select(y - 1u, 0u, y == 0u);
    let y_up = min(y + 1u, row_vertex_count - 1u);

    // fetch neighbor positions
    let position_left = load_position(x_left, y, row_vertex_count);
    let position_right = load_position(x_right, y, row_vertex_count);
    let position_down = load_position(x, y_down, row_vertex_count);
    let position_up = load_position(x, y_up, row_vertex_count);

    // approximate tangents via finite differencing
    let tangent_x = position_right - position_left;
    let tangent_y = position_up - position_down;

    // normal is cross of the two tangents
    let normal = normalize(cross(tangent_y, tangent_x));

    // write back
    let buffer_index = idx * 3u;
    normals[buffer_index + 0u] = normal.x;
    normals[buffer_index + 1u] = normal.y;
    normals[buffer_index + 2u] = normal.z;
}
