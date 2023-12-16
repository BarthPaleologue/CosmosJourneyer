precision highp float;

/* disable_uniformity_analysis */

varying vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

uniform sampler2D starfieldTexture;// the starfield texture

uniform mat4 starfieldRotation;

#include "./utils/camera.glsl";

uniform float visibility;// visibility of the starfield

#include "./utils/worldFromUV.glsl";

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)

    vec3 rayDir = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

    rayDir = vec3(starfieldRotation * vec4(rayDir, 1.0));

    vec4 finalColor = screenColor;

    vec2 starfieldUV = vec2(0.0);

    if (screenColor == vec4(0.0)) {
        // get the starfield color
        // get spherical coordinates uv for the starfield texture
        starfieldUV = vec2(
            sign(rayDir.z) * acos(rayDir.x / length(vec2(rayDir.x, rayDir.z))) / 6.28318530718,
            acos(rayDir.y) / 3.14159265359
        );

        vec4 starfieldColor = texture2D(starfieldTexture, starfieldUV);
        starfieldColor.rgb = pow(starfieldColor.rgb, vec3(2.2)); // deeper blacks

        finalColor = vec4(starfieldColor.rgb * visibility, starfieldColor.a);
    }

    gl_FragColor = finalColor;// displaying the final color
}
