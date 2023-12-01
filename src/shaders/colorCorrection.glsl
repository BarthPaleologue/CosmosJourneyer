precision lowp float;

uniform float exposure;
uniform float gamma;
uniform float contrast;
uniform float saturation;
uniform float brightness;

uniform sampler2D textureSampler;

varying vec2 vUV;

void main() {
    vec3 color = texture2D(textureSampler, vUV).rgb;
    float alpha = texture2D(textureSampler, vUV).a;

    color *= exposure;
    color = clamp(color, 0.0, 1.0);

    color = (color - 0.5) * contrast + 0.5 + brightness;
    color = clamp(color, 0.0, 1.0);

    vec3 grayscale = vec3(0.299, 0.587, 0.114) * color;
    color = mix(grayscale, color, saturation);
    color = clamp(color, 0.0, 1.0);

    color = pow(color, vec3(gamma));

    gl_FragColor = vec4(color, alpha);
}
