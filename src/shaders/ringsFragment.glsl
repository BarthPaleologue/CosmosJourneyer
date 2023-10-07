precision lowp float;

varying vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

#define MAX_STARS 5
uniform vec3 starPositions[MAX_STARS];// positions of the stars in world space
uniform int nbStars;// number of stars

#pragma glslify: camera = require(./utils/camera.glsl)

uniform vec3 planetPosition;// planet position in world space
uniform float planetRadius;// planet radius

uniform vec3 planetRotationAxis;

#pragma glslify: rings = require(./utils/rings.glsl)

#pragma glslify: completeNoise = require(./utils/noise1D.glsl)

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=camera.inverseProjection, inverseView=camera.inverseView)

#pragma glslify: rayIntersectSphere = require(./utils/rayIntersectSphere.glsl)

bool rayIntersectPlane(vec3 rayOrigin, vec3 rayDir, vec3 planetPosition, vec3 planeNormal, float tolerance, out float t) {
    float denom = dot(rayDir, planeNormal);
    if (abs(denom) <= tolerance) return false;// ray is parallel to the plane
    t = dot(planeNormal, planetPosition - rayOrigin) / denom;
    return t >= 0.0;
}

float ringDensityAtPoint(vec3 samplePoint) {
    vec3 samplePointPlanetSpace = samplePoint - planetPosition;

    float distanceToPlanet = length(samplePointPlanetSpace);
    float normalizedDistance = distanceToPlanet / planetRadius;

    // out if not intersecting with rings and interpolation area
    if (normalizedDistance < rings.start || normalizedDistance > rings.end) return 0.0;

    // compute the actual density of the rings at the sample point
    float macroRingDensity = completeNoise(normalizedDistance * rings.frequency / 10.0, 1, 2.0, 2.0);
    float ringDensity = completeNoise(normalizedDistance * rings.frequency, 5, 2.0, 2.0);
    ringDensity = mix(ringDensity, macroRingDensity, 0.5);
    ringDensity *= smoothstep(rings.start, rings.start + 0.03, normalizedDistance);
    ringDensity *= smoothstep(rings.end, rings.end - 0.03, normalizedDistance);

    ringDensity *= ringDensity;

    return ringDensity;
}

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
        // if the point is in the shadow of the ring, darken it
        vec3 samplePoint = closestPoint;
        float accDensity = 0.0;
        for (int i = 0; i < nbStars; i++) {
            vec3 towardLight = normalize(starPositions[0] - samplePoint);
            float t2;
            if (rayIntersectPlane(samplePoint, towardLight, planetPosition, planetRotationAxis, 0.001, t2)) {
                vec3 shadowSamplePoint = samplePoint + t2 * towardLight;
                accDensity += ringDensityAtPoint(shadowSamplePoint) * rings.opacity;
            }
        }
        finalColor.rgb *= pow(1.0 - accDensity, 4.0);
    }

    float impactPoint;
    if (rayIntersectPlane(camera.position, rayDir, planetPosition, planetRotationAxis, 0.001, impactPoint)) {
        // if the ray intersect the ring plane
        if (impactPoint >= 0.0 && impactPoint < maximumDistance) {
            // if the ray intersects the ring before any other object
            float t0, t1;
            if (!rayIntersectSphere(camera.position, rayDir, planetPosition, planetRadius, t0, t1) || t0 > impactPoint) {
                // if the ray is impacting a solid object after the ring plane
                vec3 samplePoint = camera.position + impactPoint * rayDir;
                float ringDensity = ringDensityAtPoint(samplePoint) * rings.opacity;

                vec3 ringShadeColor = rings.color;

                // hypothèse des rayons parallèles
                int nbLightSources = nbStars;
                for (int i = 0; i < nbStars; i++) {
                    vec3 rayToSun = normalize(starPositions[i] - planetPosition);
                    float t2, t3;
                    if (rayIntersectSphere(samplePoint, rayToSun, planetPosition, planetRadius, t2, t3)) {
                        nbLightSources -= 1;
                    }
                }
                if (nbLightSources == 0) ringShadeColor *= 0.1;

                finalColor = vec4(mix(finalColor.rgb, ringShadeColor, ringDensity), 1.0);
            }
        }
    }

    gl_FragColor = finalColor;// displaying the final color
}