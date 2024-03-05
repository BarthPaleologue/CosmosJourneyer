precision highp float;

varying vec3 vPosition;
varying vec2 vUV;

uniform float time;

uniform sampler2D warpNoise;

void main() {
    vec2 samplePoint = vec2(3.0 * vUV.x, 3.0 * vUV.y + time * 1.2);

    vec2 samplePoint2 = vec2(4.0 * vUV.y + time * 1.5, 4.0 * vUV.x);

    float noise = texture2D(warpNoise, samplePoint).r;
    noise = pow(noise, 2.0);
    noise = smoothstep(0.1, 1.0, noise);

    float noise2 = texture2D(warpNoise, samplePoint2).r;
    noise2 = pow(noise2, 2.0);
    noise2 = smoothstep(0.1, 1.0, noise2);

    vec3 finalColor = noise * vec3(0.7, 0.7, 1.0);

    finalColor = mix(finalColor, vec3(1.0, 0.7, 0.7), noise2);

    gl_FragColor = vec4(finalColor, 1.0); // apply color and lighting
} 