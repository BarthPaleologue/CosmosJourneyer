float smoothSharpener(float x, float s) {
    float offset = 0.5 - (1.0 / s);
    return smoothstep(offset, 1.0 - offset, x);
}