#define MAX_STARS 5
struct Star {
    vec3 position;
    float radius;
    vec3 color;
};
uniform Star stars[MAX_STARS];

#pragma glslify: export(stars)