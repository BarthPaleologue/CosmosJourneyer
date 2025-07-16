fn sphere_to_uv(sphere_position: vec3<f32>) -> vec2<f32> {
    let theta = acos(sphere_position.y);
    let phi = atan2(sphere_position.z, sphere_position.x);
    let u = (phi + PI) / (2.0 * PI);
    let v = (theta) / PI;

    return vec2<f32>(u, v);
}