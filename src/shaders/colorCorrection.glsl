precision lowp float;

uniform float exposure;
uniform float gamma;
uniform float contrast;
uniform float saturation;
uniform float brightness;

uniform sampler2D textureSampler;

varying vec2 vUV;

#pragma glslify: lerp = require(./utils/vec3Lerp.glsl)

void main() {
    vec3 color = texture2D(textureSampler, vUV).rgb;

    color *= exposure;
    color = clamp(color, 0.0, 1.0);

    color = (color - 0.5) * contrast + 0.5 + brightness;
    color = clamp(color, 0.0, 1.0);

    vec3 grayscale = vec3(0.299, 0.587, 0.114) * color;
    color = lerp(color, grayscale, saturation);
    color = clamp(color, 0.0, 1.0);

    color = pow(color, vec3(gamma));

    gl_FragColor = vec4(color, 1.0);
}
