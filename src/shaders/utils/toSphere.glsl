#define PI 3.1415926535897932384626433832795

// Uv range: [0, 1]
vec3 toSphere(in vec2 uv)
{
    float theta = 2.0 * PI * uv.x + - PI / 2.0;
    float phi = PI * uv.y;

    return vec3(
        cos(theta) * sin(phi),
        cos(phi),
        sin(theta) * sin(phi)
    );
}

#pragma glslify: export(toSphere)