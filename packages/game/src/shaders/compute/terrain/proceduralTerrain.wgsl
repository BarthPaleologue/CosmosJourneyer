fn hash33(point: vec3<f32>, seed: f32) -> vec3<f32> {
    var value = fract((point + vec3<f32>(seed * 0.0001)) * vec3<f32>(0.1031, 0.1030, 0.0973));
    value += dot(value, value.yxz + vec3<f32>(33.33));
    return fract((value.xxy + value.yxx) * value.zyx);
}

fn gradient_noise(point: vec3<f32>, seed: f32) -> f32 {
    let cell = floor(point);
    let local = fract(point);
    let blend = local * local * local * (local * (local * 6.0 - vec3<f32>(15.0)) + vec3<f32>(10.0));

    let g000 = hash33(cell, seed) * 2.0 - vec3<f32>(1.0);
    let g100 = hash33(cell + vec3<f32>(1.0, 0.0, 0.0), seed) * 2.0 - vec3<f32>(1.0);
    let g010 = hash33(cell + vec3<f32>(0.0, 1.0, 0.0), seed) * 2.0 - vec3<f32>(1.0);
    let g110 = hash33(cell + vec3<f32>(1.0, 1.0, 0.0), seed) * 2.0 - vec3<f32>(1.0);
    let g001 = hash33(cell + vec3<f32>(0.0, 0.0, 1.0), seed) * 2.0 - vec3<f32>(1.0);
    let g101 = hash33(cell + vec3<f32>(1.0, 0.0, 1.0), seed) * 2.0 - vec3<f32>(1.0);
    let g011 = hash33(cell + vec3<f32>(0.0, 1.0, 1.0), seed) * 2.0 - vec3<f32>(1.0);
    let g111 = hash33(cell + vec3<f32>(1.0, 1.0, 1.0), seed) * 2.0 - vec3<f32>(1.0);

    let x00 = mix(dot(g000, local), dot(g100, local - vec3<f32>(1.0, 0.0, 0.0)), blend.x);
    let x10 = mix(
        dot(g010, local - vec3<f32>(0.0, 1.0, 0.0)),
        dot(g110, local - vec3<f32>(1.0, 1.0, 0.0)),
        blend.x,
    );
    let x01 = mix(
        dot(g001, local - vec3<f32>(0.0, 0.0, 1.0)),
        dot(g101, local - vec3<f32>(1.0, 0.0, 1.0)),
        blend.x,
    );
    let x11 = mix(
        dot(g011, local - vec3<f32>(0.0, 1.0, 1.0)),
        dot(g111, local - vec3<f32>(1.0, 1.0, 1.0)),
        blend.x,
    );
    return mix(mix(x00, x10, blend.y), mix(x01, x11, blend.y), blend.z);
}

fn fractal_noise(point: vec3<f32>, seed: f32, octaves: u32) -> f32 {
    var value = 0.0;
    var amplitude = 0.5;
    var frequency = 1.0;
    var amplitude_sum = 0.0;
    for (var octave = 0u; octave < octaves; octave++) {
        value += amplitude * gradient_noise(point * frequency, seed + f32(octave) * 19.19);
        amplitude_sum += amplitude;
        frequency *= 2.03;
        amplitude *= 0.5;
    }
    return value / amplitude_sum;
}

fn cellular_distance(point: vec3<f32>, seed: f32) -> f32 {
    let cell = floor(point);
    let local = fract(point);
    var nearest_squared = 4.0;
    for (var x = -1i; x <= 1i; x++) {
        for (var y = -1i; y <= 1i; y++) {
            for (var z = -1i; z <= 1i; z++) {
                let neighbor = vec3<f32>(f32(x), f32(y), f32(z));
                let center = neighbor + hash33(cell + neighbor, seed);
                let delta = center - local;
                nearest_squared = min(nearest_squared, dot(delta, delta));
            }
        }
    }
    return sqrt(nearest_squared);
}

fn crater_noise(point: vec3<f32>, seed: f32) -> f32 {
    let distance = cellular_distance(point, seed);
    let bowl = -(1.0 - smoothstep(0.12, 0.48, distance));
    let rim_distance = abs(distance - 0.5);
    let rim = 0.35 * (1.0 - smoothstep(0.0, 0.08, rim_distance));
    let central_hill = 0.16 * (1.0 - smoothstep(0.0, 0.08, distance));
    return bowl + rim + central_hill;
}

fn terrain_elevation(unit_position: vec3<f32>, settings: ptr<function, array<f32, 12>>) -> f32 {
    let seed = (*settings)[0];
    let fragmentation = (*settings)[2];
    let continent_point = unit_position * (*settings)[3];
    let continent_noise = fractal_noise(continent_point, seed, 7u);
    let continent_detail = fractal_noise(continent_point * 3.7, seed + 47.0, 4u);
    let continent_signal = continent_noise + continent_detail * fragmentation * 0.55;
    let continent_mask = smoothstep(-0.08, 0.08, continent_signal);

    let fjord_noise = abs(fractal_noise(unit_position * (*settings)[3] * 12.0, seed + 79.0, 3u));
    let fjord_mask = continent_mask * fragmentation * (1.0 - smoothstep(0.015, 0.09, fjord_noise));

    let ridge_noise = fractal_noise(unit_position * (*settings)[5], seed + 101.0, 7u);
    let ridges = pow(clamp(1.0 - abs(ridge_noise) * 2.0, 0.0, 1.0), mix(1.0, 2.5, (*settings)[11]));
    let mountain_mask = smoothstep(
        -0.15,
        0.2,
        fractal_noise(unit_position * (*settings)[5] * 0.2, seed + 211.0, 3u),
    );
    let mountain_elevation = continent_mask * mountain_mask * ridges * (*settings)[4];

    let terrace_height = (*settings)[8];
    let terrace_level = mountain_elevation / terrace_height;
    let terraced_mountains =
        (floor(terrace_level) + smoothstep(0.42, 0.58, fract(terrace_level))) * terrace_height;
    let terrace_mask = smoothstep(
        -0.2,
        0.25,
        fractal_noise(unit_position * (*settings)[5] * 0.08, seed + 263.0, 2u),
    );

    let bumps = fractal_noise(unit_position * (*settings)[7], seed + 307.0, 4u) * (*settings)[6];
    var craters = 0.0;
    if ((*settings)[9] > 0.0) {
        let crater_point = unit_position * (*settings)[10];
        let large_craters = crater_noise(crater_point, seed + 401.0);
        let small_craters = crater_noise(crater_point * 2.1, seed + 503.0) * 0.35;
        craters = (large_craters + small_craters) * (*settings)[9];
    }

    let continental_crust = continent_mask * (*settings)[1];
    let fjord_depth = fjord_mask * ((*settings)[1] + (*settings)[4] * 0.25);
    return continental_crust
        - fjord_depth
        + mix(mountain_elevation, terraced_mountains, terrace_mask * 0.35)
        + bumps
        + craters;
}
