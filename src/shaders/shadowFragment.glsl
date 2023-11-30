precision lowp float;

varying vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

uniform sampler2D ringsLUT;

uniform int nbStars;// number of stars
#pragma glslify: stars = require(./utils/stars.glsl)

#pragma glslify: camera = require(./utils/camera.glsl)

#pragma glslify: object = require(./utils/object.glsl)

struct ShadowUniforms {
    bool hasRings;
    bool hasClouds;
    bool hasOcean;
};
uniform ShadowUniforms shadowUniforms;

#pragma glslify: rings = require(./rings/rings.glsl)

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=camera.inverseProjection, inverseView=camera.inverseView)

#pragma glslify: lineIntersectSphere = require(./utils/lineIntersectSphere.glsl)

#pragma glslify: rayIntersectsPlane = require(./utils/rayIntersectsPlane.glsl)

#pragma glslify: ringDensityAtPoint = require(./rings/ringsDensity.glsl, object=object, rings=rings, ringsLUT=ringsLUT)

float sphereOccultation(vec3 rayDir, float maximumDistance) {
    if(length(camera.position + rayDir * maximumDistance - stars[0].position) <= stars[0].radius + 1.0) {
        // The point is on the surface of the star
        return 1.0;
    }
    vec3 towardLight = normalize(stars[0].position - (camera.position + rayDir * maximumDistance));
    float t0, t1;
    if (lineIntersectSphere(camera.position + rayDir * maximumDistance, towardLight, object.position, object.radius, t0, t1)) {
        if (t0 > object.radius) {
            // there is occultation
            vec3 closestPointToPlanetCenter = camera.position + rayDir * maximumDistance + towardLight * (t0 + t1) * 0.5;
            float closestDistanceToPlanetCenter = length(closestPointToPlanetCenter - object.position);
            float r01 = remap(closestDistanceToPlanetCenter, 0.0, object.radius, 0.0, 1.0);
            return 0.2 + 0.8 * smoothstep(0.85, 1.0, r01);
        }
    }
    return 1.0;
}

float ringOccultation(vec3 rayDir, float maximumDistance) {
    if (!shadowUniforms.hasRings) {
        return 1.0;
    }

    float accDensity = 0.0;
    for (int i = 0; i < nbStars; i++) {
        vec3 towardLight = normalize(stars[i].position - (camera.position + rayDir * maximumDistance));
        float t2;
        if (rayIntersectsPlane(camera.position + rayDir * maximumDistance, towardLight, object.position, object.rotationAxis, 0.001, t2)) {
            vec3 shadowSamplePoint = camera.position + rayDir * maximumDistance + t2 * towardLight;
            accDensity += ringDensityAtPoint(shadowSamplePoint) * rings.opacity;
        }
    }
    return pow(1.0 - accDensity, 4.0) * 0.5 + 0.5;
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV);// the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    float maximumDistance = length(pixelWorldPosition - camera.position) * remap(depth, 0.0, 1.0, camera.near, camera.far);

    vec3 rayDir = normalize(pixelWorldPosition - camera.position);// normalized direction of the ray

    vec4 finalColor = screenColor;

    if (maximumDistance < camera.far) {
        // There is a solid object in front of the camera
        // maybe it is in this planet's shadow
        float sphereShadow = sphereOccultation(rayDir, maximumDistance);

        // maybe it is in the shadow of the rings
        float ringShadow = ringOccultation(rayDir, maximumDistance);

        finalColor.rgb *= min(sphereShadow, ringShadow);
    }

    //finalColor.rgb = vec3(texture2D(ringsLUT, vUV).r);

    gl_FragColor = finalColor;// displaying the final color
}