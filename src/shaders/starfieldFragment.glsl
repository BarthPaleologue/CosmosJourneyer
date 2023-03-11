precision lowp float;

varying vec2 vUV; // screen coordinates

uniform sampler2D textureSampler; // the original screen texture
uniform sampler2D depthSampler; // the depth map of the camera

uniform sampler2D starfieldTexture; // the starfield texture

uniform vec3 cameraPosition; // position of the camera in world space

uniform mat4 inverseProjection; // camera's projection matrix
uniform mat4 inverseView; // camera's view matrix

uniform float cameraNear; // camera minZ
uniform float cameraFar; // camera maxZ

uniform float visibility; // visibility of the starfield

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=inverseProjection, inverseView=inverseView)

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV); // the current screen color

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
    
    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)

    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition); // normalized direction of the ray

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion

    vec4 finalColor;

    if(maximumDistance < cameraFar) finalColor = screenColor;
    else {
        // get spherical coordinates uv for the starfield texture
        vec2 starfieldUV = vec2(
            sign(rayDir.z) * acos(rayDir.x / length(vec2(rayDir.x, rayDir.z))) / 6.28318530718,
            acos(rayDir.y) / 3.14159265359
        );

        // get the starfield color
        vec4 starfieldColor = texture2D(starfieldTexture, starfieldUV);

        finalColor = vec4(starfieldColor.rgb * visibility, starfieldColor.a);
    }

    gl_FragColor = finalColor; // displaying the final color
}
