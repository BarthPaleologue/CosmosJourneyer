precision lowp float;

varying vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

uniform vec3 cameraPosition;// position of the camera in world space

#define MAX_STARS 5
uniform vec3 starPositions[MAX_STARS];// positions of the stars in world space
uniform int nbStars;// number of stars

uniform mat4 inverseProjection;// camera's projection matrix
uniform mat4 inverseView;// camera's view matrix

uniform float cameraNear;// camera minZ
uniform float cameraFar;// camera maxZ

uniform vec3 planetPosition;// planet position in world space
uniform float planetRadius;// planet radius

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=inverseProjection, inverseView=inverseView)

#pragma glslify: lineIntersectSphere = require(./utils/lineIntersectSphere.glsl)

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV);// the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint);// the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition);// normalized direction of the ray

    vec4 finalColor = screenColor;

    if (maximumDistance < cameraFar) {
        // this planet occludes the pixel in the depth map
        // maybe there is occlusion by the planet
        // basic body shadowing
        vec3 towardLight = normalize(starPositions[0] - (cameraPosition + rayDir * maximumDistance));
        float t0, t1;
        if (lineIntersectSphere(cameraPosition + rayDir * maximumDistance, towardLight, planetPosition, planetRadius, t0, t1)) {
            if (t0 > planetRadius) {
                // there is occultation
                vec3 closestPointToPlanetCenter = cameraPosition + rayDir * maximumDistance + towardLight * (t0 + t1) * 0.5;
                float closestDistanceToPlanetCenter = length(closestPointToPlanetCenter - planetPosition);
                float r01 = remap(closestDistanceToPlanetCenter, 0.0, planetRadius, 0.0, 1.0);
                finalColor.rgb *= 0.2 + 0.8 * smoothstep(0.85, 1.0, r01);
            }
        }
    }

    gl_FragColor = finalColor;// displaying the final color
}