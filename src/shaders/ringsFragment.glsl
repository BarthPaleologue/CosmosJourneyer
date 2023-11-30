precision lowp float;

varying vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

uniform sampler2D ringsLUT;

uniform int nbStars;// number of stars
#pragma glslify: stars = require(./utils/stars.glsl)

#pragma glslify: camera = require(./utils/camera.glsl)

#pragma glslify: object = require(./utils/object.glsl)

#pragma glslify: rings = require(./rings/rings.glsl)

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=camera.inverseProjection, inverseView=camera.inverseView)

#pragma glslify: rayIntersectSphere = require(./utils/rayIntersectSphere.glsl)

#pragma glslify: rayIntersectsPlane = require(./utils/rayIntersectsPlane.glsl)

#pragma glslify: ringDensityAtPoint = require(./rings/ringsDensity.glsl, object=object, rings=rings, ringsLUT=ringsLUT)

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV);// the pixel position in world space (near plane)

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera.position) * remap(depth, 0.0, 1.0, camera.near, camera.far);

    vec3 rayDir = normalize(pixelWorldPosition - camera.position);// normalized direction of the ray

    vec4 finalColor = screenColor;

    float impactPoint;
    if (rayIntersectsPlane(camera.position, rayDir, object.position, object.rotationAxis, 0.001, impactPoint)) {
        // if the ray intersect the ring plane
        if (impactPoint >= 0.0 && impactPoint < maximumDistance) {
            // if the ray intersects the ring before any other object
            float t0, t1;
            if (!rayIntersectSphere(camera.position, rayDir, object.position, object.radius, t0, t1) || t0 > impactPoint) {
                // if the ray is impacting a solid object after the ring plane
                vec3 samplePoint = camera.position + impactPoint * rayDir;
                float ringDensity = ringDensityAtPoint(samplePoint) * rings.opacity;

                vec3 ringShadeColor = rings.color;

                // hypothèse des rayons parallèles
                int nbLightSources = nbStars;
                for (int i = 0; i < nbStars; i++) {
                    vec3 rayToSun = normalize(stars[i].position - object.position);
                    float t2, t3;
                    if (rayIntersectSphere(samplePoint, rayToSun, object.position, object.radius, t2, t3)) {
                        nbLightSources -= 1;
                    }
                }
                if (nbLightSources == 0) ringShadeColor *= 0.1;

                finalColor = vec4(mix(finalColor.rgb, ringShadeColor, ringDensity), 1.0);
            }
        }
    }

    //finalColor.rgb = vec3(texture2D(ringsLUT, vUV).r);

    gl_FragColor = finalColor;// displaying the final color
}