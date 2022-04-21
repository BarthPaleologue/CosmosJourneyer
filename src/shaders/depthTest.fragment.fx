precision highp float;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

uniform float cameraNear;
uniform float cameraFar;

varying vec2 vUV;

float remap(float value, float low1, float high1, float low2, float high2) {
    return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
}

void main() {
    vec4 colorSample = texture2D(textureSampler, vUV);
    vec4 depthSample = texture2D(depthSampler, vUV);

    float depth = depthSample.r;

    float sceneDepth = remap(depth, 0.0, 1.0, cameraNear, cameraFar);

    if(sceneDepth > cameraFar) {
        gl_FragColor = vec4(colorSample.rgb, 1.0);
    } else {
        gl_FragColor = vec4(vec3(depth), 1.0);
    }
}