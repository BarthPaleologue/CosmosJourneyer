precision lowp float;

varying vec2 vUV; // screen coordinates

uniform sampler2D textureSampler; // the original screen texture
uniform sampler2D depthSampler; // the depth map of the camera

uniform sampler2D starfieldTexture; // the starfield texture

uniform vec3 cameraPosition; // position of the camera in world space

uniform mat4 inverseProjection; // camera's projection matrix
uniform mat4 inverseView; // camera's view matrix

uniform float visibility; // visibility of the starfield

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=inverseProjection, inverseView=inverseView)

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV); // the current screen color

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
    
    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)

    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition); // normalized direction of the ray

    vec4 finalColor;

    // get the starfield color
    // get spherical coordinates uv for the starfield texture
    vec2 starfieldUV = vec2(
        sign(rayDir.z) * acos(rayDir.x / length(vec2(rayDir.x, rayDir.z))) / 6.28318530718,
        acos(rayDir.y) / 3.14159265359
    );
    vec4 starfieldColor = texture2D(starfieldTexture, starfieldUV);

    if(screenColor == vec4(0.0)) finalColor = vec4(starfieldColor.rgb * visibility, starfieldColor.a);
    else finalColor = screenColor;
        
    gl_FragColor = finalColor; // displaying the final color
}
