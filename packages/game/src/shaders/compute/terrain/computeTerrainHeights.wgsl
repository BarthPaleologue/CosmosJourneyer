#include "./proceduralTerrain.wgsl";

@group(0) @binding(0) var<storage, read> coordinates: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> heights: array<f32>;
@group(0) @binding(2) var<storage, read> params: array<f32>;

@compute @workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x >= u32(params[0])) { return; }
    let coordinate = coordinates[id.x];
    let cos_latitude = cos(coordinate.x);
    let unit_position = vec3<f32>(cos_latitude * cos(coordinate.y), sin(coordinate.x), cos_latitude * sin(coordinate.y));
    var settings = array<f32, 8>(params[1], params[2], params[3], params[4], params[5], params[6], params[7], params[8]);
    heights[id.x] = terrain_elevation(unit_position, &settings);
}
