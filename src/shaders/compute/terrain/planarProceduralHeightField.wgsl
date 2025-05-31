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
    octaves : i32,
    lacunarity : f32,
    persistence : f32,
    scaleFactor : f32,
};

@group(0) @binding(0) var<storage, read_write> positions : array<f32>;
@group(0) @binding(1) var<storage, read_write> indices : array<u32>;
@group(0) @binding(2) var<uniform> params : Params;

#include "../utils/pi.wgsl";

#include "../noise/gradientNoise2D.wgsl";

#include "../noise/erosionNoise3D.wgsl";

@compute @workgroup_size(16,16,1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x >= params.nbVerticesPerRow || id.y >= params.nbVerticesPerRow) { 
        return; 
    }

    let x : f32 = f32(id.x);
    let y : f32 = f32(id.y);

    let index: u32 = id.x + id.y * u32(params.nbVerticesPerRow);

    var vertex_position = vec3<f32>(params.size * x / f32(params.nbVerticesPerRow - 1) - params.size / 2.0, 0.0, params.size * y / f32(params.nbVerticesPerRow - 1) - params.size / 2.0);

    let elevation = mountain(vertex_position * 0.5, vec3f(0.0, 1.0, 0.0));

    positions[index * 3 + 0] = vertex_position.x;
    positions[index * 3 + 1] = elevation;
    positions[index * 3 + 2] = vertex_position.z;

    if(x > 0 && y > 0) {
        let indexIndex = ((id.x - 1) + (id.y - 1) * (params.nbVerticesPerRow - 1)) * 6;

        indices[indexIndex + 0] = index - 1;
        indices[indexIndex + 1] = index - params.nbVerticesPerRow - 1;
        indices[indexIndex + 2] = index;

        indices[indexIndex + 3] = index;
        indices[indexIndex + 4] = index - params.nbVerticesPerRow - 1;
        indices[indexIndex + 5] = index - params.nbVerticesPerRow;
    }
}