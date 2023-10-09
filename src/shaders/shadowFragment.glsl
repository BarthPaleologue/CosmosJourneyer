precision lowp float;

in vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

#define MAX_STARS 5
uniform int nbStars;// number of stars
struct Star {
    vec3 position;
};
uniform Star stars[MAX_STARS];

#pragma glslify: camera = require(./utils/camera.glsl)

#pragma glslify: object = require(./utils/object.glsl)

struct ShadowUniforms {
    bool hasRings;
    bool hasClouds;
    bool hasOcean;
};
uniform ShadowUniforms shadowUniforms;

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=camera.inverseProjection, inverseView=camera.inverseView)

#pragma glslify: lineIntersectSphere = require(./utils/lineIntersectSphere.glsl)

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV);// the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - camera.position) * remap(depth, 0.0, 1.0, camera.near, camera.far);
    float maximumDistance = length(closestPoint);// the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - camera.position);// normalized direction of the ray

    vec4 finalColor = screenColor;

    if (maximumDistance < camera.far) {
        // this planet occludes the pixel in the depth map
        // maybe there is occlusion by the planet
        // basic body shadowing
        vec3 towardLight = normalize(stars[0].position - (camera.position + rayDir * maximumDistance));
        float t0, t1;
        if (lineIntersectSphere(camera.position + rayDir * maximumDistance, towardLight, object.position, object.radius, t0, t1)) {
            if (t0 > object.radius) {
                // there is occultation
                vec3 closestPointToPlanetCenter = camera.position + rayDir * maximumDistance + towardLight * (t0 + t1) * 0.5;
                float closestDistanceToPlanetCenter = length(closestPointToPlanetCenter - object.position);
                float r01 = remap(closestDistanceToPlanetCenter, 0.0, object.radius, 0.0, 1.0);
                finalColor.rgb *= 0.2 + 0.8 * smoothstep(0.85, 1.0, r01);
            }
        }
    }

    gl_FragColor = finalColor;// displaying the final color
}