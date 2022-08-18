precision lowp float;

varying vec2 vUV; // screen coordinates

uniform sampler2D textureSampler; // the original screen texture
uniform sampler2D depthSampler; // the depth map of the camera

uniform vec3 cameraPosition; // position of the camera in world space

uniform mat4 projection; // camera's projection matrix
uniform mat4 view; // camera's view matrix

uniform float cameraNear; // camera minZ
uniform float cameraFar; // camera maxZ

uniform float visibility; // visibility of the starfield

#pragma glslify: completeNoise = require(./utils/noise.glsl)

#pragma glslify: saturate = require(./utils/saturate.glsl)

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, projection=projection, view=view)

#pragma glslify: lerp = require(./utils/vec3Lerp.glsl)

#pragma glslify: completeWorley = require(./utils/worley.glsl)

#pragma glslify: fractalSimplex4 = require(./utils/simplex4.glsl)
#pragma glslify: rayIntersectSphere = require(./utils/rayIntersectSphere.glsl)

void main() {
    vec3 screenColor = texture2D(textureSampler, vUV).rgb; // the current screen color

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
    
    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition); // normalized direction of the ray

    vec3 finalColor;

    if(maximumDistance < cameraFar) finalColor = screenColor;
    else {
        float t0, t1;
        rayIntersectSphere(cameraPosition, rayDir, vec3(0.0), 100.0, t0, t1);

        vec3 samplePoint = normalize(cameraPosition + max(t0, t1) * rayDir);

        vec3 nebulaSamplePoint = samplePoint + vec3(
            completeNoise(samplePoint, 1, 2.0, 2.0),
            37.0 * completeNoise(samplePoint, 1, 2.0, 2.0),
            -15.0 * completeNoise(samplePoint, 1, 2.0, 2.0)
        ) * 0.1;
        float nebulaNoise = 1.0 - completeWorley(nebulaSamplePoint, 1, 2.0, 2.0);
        nebulaNoise = pow(nebulaNoise, 3.0);
        //nebulaNoise = smoothstep(0.4, 0.6, nebulaNoise);

        float detailNoise = fractalSimplex4(vec4(samplePoint * 10.0, 0.0), 5, 2.0, 2.0);
        nebulaNoise *= detailNoise;

        float starNoise = 1.0 - completeWorley(samplePoint * 150.0, 1, 2.0, 2.0);
        starNoise = smoothstep(0.8, 1.0, starNoise);

        float colorSeparation = completeNoise(samplePoint * 200.0, 1, 2.0, 2.0);


        float starLight = starNoise;
        if(starNoise > 0.82) starLight = 1.0;
        else starLight /= 1.5;

        vec3 color1 = vec3(1.0);
        vec3 color2 = vec3(0.4, 0.4, 2.0);

        finalColor = 5.0 * starLight * lerp(color1, color2, colorSeparation) * visibility;

        finalColor += nebulaNoise * vec3(0.3, 0.0, 0.0);
    }

    gl_FragColor = vec4(finalColor, 1.0); // displaying the final color
}