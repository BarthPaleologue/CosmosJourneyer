struct Object {
    vec3 position;
    float radius;
    vec3 rotationAxis;
};
uniform Object object;

#pragma glslify: export(object)