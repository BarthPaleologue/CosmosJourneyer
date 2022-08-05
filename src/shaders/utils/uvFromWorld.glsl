vec2 uvFromWorld(vec3 pos) {
    vec4 uvRaw = projection * view * vec4(pos, 1.0);
    vec2 uv = uvRaw.xy / uvRaw.w;
    uv += vec2(1.0);
    uv /= 2.0;
    return uv;
}

#pragma glslify: export(uvFromWorld)