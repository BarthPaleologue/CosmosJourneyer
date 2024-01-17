precision highp float;

varying vec3 vPosition;
varying vec2 vUV;

uniform float time;

uniform sampler2D warpNoise;

void main() {
    vec2 samplePoint = vec2(3.0 * vUV.x, 3.0 * vUV.y + time * 1.2);

    float noise = texture2D(warpNoise, samplePoint).r;
    noise = pow(noise, 8.0);
    noise = smoothstep(0.1, 1.0, noise);

    if(noise == 0.0) discard;

    vec3 finalColor = noise * vec3(0.7, 0.7, 1.0) * 3.0;

    gl_FragColor = vec4(finalColor, 1.0); // apply color and lighting
} 