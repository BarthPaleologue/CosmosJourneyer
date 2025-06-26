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

@group(0) @binding(0) var<storage, read_write> indices : array<u32>;
@group(0) @binding(1) var<uniform> params : Params;

@compute @workgroup_size(16,16,1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x >= params.row_vertex_count || id.y >= params.row_vertex_count) { 
        return; 
    }

    let index: u32 = id.x + id.y * u32(params.row_vertex_count);

    if(id.x > 0 && id.y > 0) {
        let indexIndex = ((id.x - 1) + (id.y - 1) * (params.row_vertex_count - 1)) * 6;

        indices[indexIndex + 0] = index - 1;
        indices[indexIndex + 1] = index - params.row_vertex_count - 1;
        indices[indexIndex + 2] = index;

        indices[indexIndex + 3] = index;
        indices[indexIndex + 4] = index - params.row_vertex_count - 1;
        indices[indexIndex + 5] = index - params.row_vertex_count;
    }
}