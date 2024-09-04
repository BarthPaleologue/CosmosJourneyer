vec3 reinhardTonemap(vec3 v) {
    return v / (1.0f + v);
}