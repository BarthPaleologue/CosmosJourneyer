precision lowp float;

/* disable_uniformity_analysis */

varying vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

uniform sampler2D ringsLUT;

#include "./utils/stars.glsl";
float star_radiuses[MAX_STARS];

#include "./utils/camera.glsl";

#include "./utils/object.glsl";

uniform bool shadowUniforms_hasRings;
uniform bool shadowUniforms_hasClouds;
uniform bool shadowUniforms_hasOcean;

#include "./rings/rings.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/lineIntersectSphere.glsl";

#include "./utils/rayIntersectsPlane.glsl";

#include "./rings/ringsDensity.glsl";

float sphereOccultation(vec3 rayDir, float maximumDistance) {
    if(length(camera_position + rayDir * maximumDistance - star_positions[0]) <= star_radiuses[0] + 1.0) {
        // The point is on the surface of the star
        return 1.0;
    }
    vec3 towardLight = normalize(star_positions[0] - (camera_position + rayDir * maximumDistance));
    float t0, t1;
    if (lineIntersectSphere(camera_position + rayDir * maximumDistance, towardLight, object_position, object_radius, t0, t1)) {
        if (t0 > object_radius) {
            // there is occultation
            vec3 closestPointToPlanetCenter = camera_position + rayDir * maximumDistance + towardLight * (t0 + t1) * 0.5;
            float closestDistanceToPlanetCenter = length(closestPointToPlanetCenter - object_position);
            float r01 = remap(closestDistanceToPlanetCenter, 0.0, object_radius, 0.0, 1.0);
            return 0.2 + 0.8 * smoothstep(0.85, 1.0, r01);
        }
    }
    return 1.0;
}

float ringOccultation(vec3 rayDir, float maximumDistance) {
    if (!shadowUniforms_hasRings) {
        return 1.0;
    }

    float accDensity = 0.0;
    for (int i = 0; i < nbStars; i++) {
        vec3 towardLight = normalize(star_positions[i] - (camera_position + rayDir * maximumDistance));
        float t2;
        if (rayIntersectsPlane(camera_position + rayDir * maximumDistance, towardLight, object_position, object_rotationAxis, 0.001, t2)) {
            vec3 shadowSamplePoint = camera_position + rayDir * maximumDistance + t2 * towardLight;
            accDensity += ringDensityAtPoint(shadowSamplePoint) * rings_opacity;
        }
    }
    return pow(1.0 - accDensity, 4.0) * 0.5 + 0.5;
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    float maximumDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);

    vec3 rayDir = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

    vec4 finalColor = screenColor;

    if (maximumDistance < camera_far) {
        // There is a solid object in front of the camera
        // maybe it is in this planet's shadow
        float sphereShadow = sphereOccultation(rayDir, maximumDistance);

        // maybe it is in the shadow of the rings
        float ringShadow = ringOccultation(rayDir, maximumDistance);

        finalColor.rgb *= min(sphereShadow, ringShadow);
    }

    gl_FragColor = finalColor;// displaying the final color
}