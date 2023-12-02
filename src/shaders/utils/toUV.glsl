#define PI 3.1415926535897932384626433832795

vec2 toUV(in vec3 n)
{
    vec2 uv;

    uv.x = atan(-n.x, n.z);
    uv.x = (uv.x + PI / 2.0) / (PI * 2.0) + PI * (28.670 / 360.0);

    uv.y = acos(n.y) / PI;

    return uv;
}