struct RingsUniforms {
    float start;// ring start
    float end;// ring end
    float frequency;// ring frequency
    float opacity;// ring opacity
    vec3 color;// ring color
};
uniform RingsUniforms rings;

#pragma glslify: export(rings)