vec2 uvFromWorld(vec3 pos, mat4 projection, mat4 view) {
    vec4 uvRaw = projection * view * vec4(pos, 1.0);
    vec2 uv = uvRaw.xy / uvRaw.w;
    uv = (uv + 1.0) / 2.0;
    return uv;
}