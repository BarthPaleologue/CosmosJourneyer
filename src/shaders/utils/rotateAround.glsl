// rotation using https://www.wikiwand.com/en/Rodrigues%27_rotation_formula
vec3 rotateAround(vec3 vector, vec3 axis, float theta) {
    // Please note that unit vector are required, i did not divided by the norms
    return cos(theta) * vector + cross(axis, vector) * sin(theta) + axis * dot(axis, vector) * (1.0 - cos(theta));
}