precision lowp float;

// varying
varying vec2 vUV; // screen coordinates

// uniforms
uniform sampler2D textureSampler; // the original screen texture
uniform sampler2D depthSampler; // the depth map of the camera

uniform vec3 cameraPosition; // position of the camera in world space

uniform mat4 projection; // camera's projection matrix
uniform mat4 view; // camera's view matrix

uniform float cameraNear; // camera minZ
uniform float cameraFar; // camera maxZ

uniform float visibility; // visibility of the starfield

#pragma glslify: completeNoise = require(./utils/noise.glsl)

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, projection=projection, view=view)

#pragma glslify: lerp = require(./utils/vec3Lerp.glsl)

void main() {
    vec3 screenColor = texture2D(textureSampler, vUV).rgb; // the current screen color

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
    
    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition); // normalized direction of the ray

    vec3 finalColor;

    if(maximumDistance * 1.1 < cameraFar) finalColor = screenColor;
    else {
        vec3 samplePoint = normalize(closestPoint);
        float noiseValue = completeNoise(samplePoint*500.0, 1, 2.0, 2.0);
        float noiseValue2 = clamp(completeNoise(samplePoint, 1, 2.0, 2.0), 0.5, 1.0);
        float noiseValue3 = completeNoise(samplePoint*200.0, 1, 2.0, 2.0);

        float starLight = 0.0;
        if(noiseValue > 0.87) starLight = 1.0;

        vec3 color1 = vec3(1.0);
        vec3 color2 = vec3(0.4, 0.4, 2.0);

        finalColor = starLight * lerp(color1, color2, noiseValue3) * visibility;
    }

    gl_FragColor = vec4(finalColor, 1.0); // displaying the final color
}