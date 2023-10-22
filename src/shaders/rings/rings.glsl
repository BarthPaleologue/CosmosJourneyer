struct Rings {
    float start;// ring start
    float end;// ring end
    float frequency;// ring frequency
    float opacity;// ring opacity
    vec3 color;// ring color
};
uniform Rings rings;

#pragma glslify: export(rings)