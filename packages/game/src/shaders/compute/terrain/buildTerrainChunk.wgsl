#include "./proceduralTerrain.wgsl";

@group(0) @binding(0) var<storage, read_write> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read_write> normals: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> params: array<f32>;

fn position_on_cube(x: f32, y: f32) -> vec3<f32> {
    let row_vertex_count = u32(params[0]);
    let half_subdivisions = f32(row_vertex_count - 1u) * 0.5;
    let scale = params[1] / f32(row_vertex_count - 1u);
    let local_x = (x - half_subdivisions) * scale;
    let local_y = (y - half_subdivisions) * scale;
    let face = u32(params[2]);
    let center = vec3<f32>(params[4], params[5], params[6]);
    var offset = vec3<f32>(local_x, local_y, 0.0);
    switch face {
        case 0u: { offset = vec3<f32>(local_x, 0.0, local_y); }
        case 1u: { offset = vec3<f32>(local_y, 0.0, local_x); }
        case 2u: { offset = vec3<f32>(0.0, local_x, local_y); }
        case 3u: { offset = vec3<f32>(0.0, local_y, local_x); }
        case 4u: { offset = vec3<f32>(local_x, local_y, 0.0); }
        case 5u: { offset = vec3<f32>(local_y, local_x, 0.0); }
        default: {}
    }
    return center + offset;
}

fn displaced_position(x: f32, y: f32) -> vec3<f32> {
    let unit_position = normalize(position_on_cube(x, y));
    var settings = array<f32, 12>(
        params[7],
        params[8],
        params[9],
        params[10],
        params[11],
        params[12],
        params[13],
        params[14],
        params[15],
        params[16],
        params[17],
        params[18],
    );
    return unit_position * (params[3] + terrain_elevation(unit_position, &settings));
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let row_vertex_count = u32(params[0]);
    if (id.x >= row_vertex_count || id.y >= row_vertex_count) { return; }
    let x = f32(id.x);
    let y = f32(id.y);
    let absolute_position = displaced_position(x, y);
    let chunk_sphere_position = normalize(vec3<f32>(params[4], params[5], params[6])) * params[3];
    let tangent_x = displaced_position(x + 1.0, y) - displaced_position(x - 1.0, y);
    let tangent_y = displaced_position(x, y + 1.0) - displaced_position(x, y - 1.0);
    var normal = normalize(cross(tangent_y, tangent_x));
    if (dot(normal, absolute_position) < 0.0) { normal = -normal; }
    let index = id.x * row_vertex_count + id.y;
    positions[index] = vec4<f32>(absolute_position - chunk_sphere_position, 1.0);
    normals[index] = vec4<f32>(normal, 0.0);
}
