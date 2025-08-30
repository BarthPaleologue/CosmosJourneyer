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

@group(0) @binding(0) var output_texture : texture_storage_2d<rgba8unorm, write>;

// Tunables (constants to keep the interface minimal)
const SEED : u32 = 0xA53C9E37u;
const GAIN : f32 = 1.0; // increase toward ~1.5 for stronger contrast (may clip)

// 32-bit integer mix (Murmur-style fmix)
fn hash32(x : u32) -> u32 {
    var h = x;
    h ^= h >> 16u;
    h *= 0x7feb352du;
    h ^= h >> 15u;
    h *= 0x846ca68bu;
    h ^= h >> 16u;
    return h;
}

// Hash 2D coords (+ seed) -> [0,1)
fn noise01(p : vec2<u32>) -> f32 {
    let m = p.x ^ (p.y * 0x9E3779B9u) ^ SEED;
    let h = hash32(m);
    // Convert to [0,1) using 1/2^32
    return f32(h) * (1.0 / 4294967296.0);
}

// Wrap an i32 coordinate into [0, max)
fn wrapi(v : i32, maxv : i32) -> i32 {
    // WGSL's % keeps sign; make it positive
    return ((v % maxv) + maxv) % maxv;
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
    let dims  : vec2<u32> = textureDimensions(output_texture);
    if (gid.x >= dims.x || gid.y >= dims.y) { return; }

    // Base white noise from hashed integer coords
    let p_u   = gid.xy;
    let base  = noise01(p_u);

    // 3x3 box blur of the same hashed noise field (computed analytically)
    var sum   : f32 = 0.0;
    let w     : i32 = i32(dims.x);
    let h     : i32 = i32(dims.y);
    let p_i   : vec2<i32> = vec2<i32>(i32(gid.x), i32(gid.y));

    for (var dy : i32 = -1; dy <= 1; dy = dy + 1) {
        for (var dx : i32 = -1; dx <= 1; dx = dx + 1) {
            let nx = wrapi(p_i.x + dx, w);
            let ny = wrapi(p_i.y + dy, h);
            sum += noise01(vec2<u32>(u32(nx), u32(ny)));
        }
    }
    let blur  = sum * (1.0 / 9.0);

    // High-pass: suppress low frequencies; remap to [0,1]
    let hi    = base - blur;
    let v     = clamp(0.5 + GAIN * hi, 0.0, 1.0);

    textureStore(output_texture, vec2<i32>(p_i.x, p_i.y), vec4<f32>(v, v, v, 1.0));
}
