float tanh01(float x) {
    return (tanh(x) + 1.0) / 2.0;
}
float tanhSharpener(float x, float s) {
    float sampleValue = (x - 0.5) * s;
    return tanh01(sampleValue);
}

#pragma glslify: export(tanhSharpener)