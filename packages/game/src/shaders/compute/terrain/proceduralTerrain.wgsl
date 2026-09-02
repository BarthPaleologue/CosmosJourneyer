fn hash3(point: vec3<f32>, seed: f32) -> f32 {
    return fract(sin(dot(point, vec3<f32>(127.1, 311.7, 74.7)) + seed * 0.001) * 43758.5453);
}

fn value_noise(point: vec3<f32>, seed: f32) -> f32 {
    let cell = floor(point);
    let local = fract(point);
    let blend = local * local * (vec3<f32>(3.0) - 2.0 * local);
    let x00 = mix(hash3(cell, seed), hash3(cell + vec3<f32>(1.0, 0.0, 0.0), seed), blend.x);
    let x10 = mix(hash3(cell + vec3<f32>(0.0, 1.0, 0.0), seed), hash3(cell + vec3<f32>(1.0, 1.0, 0.0), seed), blend.x);
    let x01 = mix(hash3(cell + vec3<f32>(0.0, 0.0, 1.0), seed), hash3(cell + vec3<f32>(1.0, 0.0, 1.0), seed), blend.x);
    let x11 = mix(hash3(cell + vec3<f32>(0.0, 1.0, 1.0), seed), hash3(cell + vec3<f32>(1.0, 1.0, 1.0), seed), blend.x);
    return mix(mix(x00, x10, blend.y), mix(x01, x11, blend.y), blend.z) * 2.0 - 1.0;
}

fn fractal_noise(point: vec3<f32>, seed: f32, octaves: u32) -> f32 {
    var value = 0.0;
    var amplitude = 0.5;
    var frequency = 1.0;
    var amplitude_sum = 0.0;
    for (var octave = 0u; octave < octaves; octave++) {
        value += amplitude * value_noise(point * frequency, seed + f32(octave) * 19.19);
        amplitude_sum += amplitude;
        frequency *= 2.03;
        amplitude *= 0.5;
    }
    return value / amplitude_sum;
}

fn terrain_elevation(unit_position: vec3<f32>, settings: ptr<function, array<f32, 8>>) -> f32 {
    let continent_noise = fractal_noise(unit_position * (*settings)[3], (*settings)[0], 6u);
    let fragmented = 1.0 - (*settings)[2] * (1.0 - (continent_noise * 0.5 + 0.5));
    let continent_mask = smoothstep(0.3, 0.5, fragmented);
    let ridge_noise = fractal_noise(unit_position * (*settings)[5], (*settings)[0] + 101.0, 7u);
    let ridges = smoothstep(0.4, 1.0, 1.0 - abs(ridge_noise));
    let mountain_mask = fractal_noise(unit_position * (*settings)[5] * 0.25, (*settings)[0] + 211.0, 2u) * 0.5 + 0.5;
    let bumps = fractal_noise(unit_position * (*settings)[7], (*settings)[0] + 307.0, 4u);
    return continent_mask * (*settings)[1]
        + continent_mask * mountain_mask * ridges * (*settings)[4]
        + bumps * (*settings)[6];
}
