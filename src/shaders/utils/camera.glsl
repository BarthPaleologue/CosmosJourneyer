struct Camera {
    vec3 position;
    mat4 projection;
    mat4 view;
    mat4 inverseProjection;
    mat4 inverseView;
    float near;
    float far;
};
uniform Camera camera;

#pragma glslify: export(camera)