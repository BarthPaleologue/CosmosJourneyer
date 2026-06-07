precision highp float;

#define DISABLE_UNIFORMITY_ANALYSIS

// based on https://www.shadertoy.com/view/tsBXW3

#define DISK_STEPS 12.0//disk texture layers

const float TAU = 6.28318530718;

varying vec2 vUV;

uniform float elapsedSeconds;

#include "./utils/object.glsl";

uniform float accretionDiskRadius;
uniform float warpingMinkowskiFactor;
uniform float standardGravitationalParameter;

uniform float schwarzschildRadius;
uniform float frameDraggingFactor;

uniform vec3 worldPosition;
uniform mat4 diskRotation;
uniform mat4 inverseDiskRotation;

//TODO: make these uniforms
const float accretionDiskHeight = 1000.0;
const bool hasAccretionDisk = true;
const float maxDiskNoiseShearRadians = 2.0 * TAU;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

uniform samplerCube starfieldTexture;

uniform mat4 starfieldRotation;

#include "./utils/camera.glsl";

#include "./utils/remap.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/uvFromWorld.glsl";

#include "./utils/rotateAround.glsl";

#include "./utils/rayIntersectSphere.glsl";

const vec3 localDiskNormal = vec3(0.0, 1.0, 0.0);

vec3 worldToBlackHoleSpace(vec3 position) {
    return mat3(inverseDiskRotation) * (position - worldPosition);
}

vec3 directionToBlackHoleSpace(vec3 direction) {
    return mat3(inverseDiskRotation) * direction;
}

vec3 blackHoleSpaceToWorld(vec3 position) {
    return mat3(diskRotation) * position + worldPosition;
}

vec3 directionToWorldSpace(vec3 direction) {
    return mat3(diskRotation) * direction;
}

// Angular velocity for a circular orbit at a given radius
float getKeplerianAngularVelocity(float orbitalRadius) {
    return sqrt(standardGravitationalParameter / max(pow(orbitalRadius, 3.0), 1e-6));
}

float getDiskNoiseShearCycleDuration() {
    float innerDiskNoiseRadius = schwarzschildRadius * 2.5;
    float outerDiskNoiseRadius = max(accretionDiskRadius, innerDiskNoiseRadius);
    float maxAngularShear = getKeplerianAngularVelocity(innerDiskNoiseRadius) - getKeplerianAngularVelocity(outerDiskNoiseRadius);
    return maxDiskNoiseShearRadians / max(maxAngularShear, 1e-6);
}

float hash(float x) { return fract(sin(x) * 152754.742); }
float hash(vec2 x) { return hash(x.x + hash(x.y)); }

float valueNoisePeriodicX(vec2 p, float periodX) {
    vec2 cell = floor(p);
    vec2 fr = fract(p);
    fr = (3. - 2.*fr)*fr*fr;

    float x0 = mod(cell.x, periodX);
    float x1 = mod(cell.x + 1.0, periodX);
    float y0 = cell.y;
    float y1 = cell.y + 1.0;

    float bl = hash(vec2(x0, y0));
    float br = hash(vec2(x1, y0));
    float tl = hash(vec2(x0, y1));
    float tr = hash(vec2(x1, y1));

    float b = mix(bl, br, fr.x);
    float t = mix(tl, tr, fr.x);
    return mix(b, t, fr.y);
}

float sampleDiskNoise(vec3 projectedSamplePoint, float relativeDistance, float intensity, float shearAgeSeconds) {
    float orbitalRadius = max(length(projectedSamplePoint.xz), schwarzschildRadius);
    float theta = -shearAgeSeconds * getKeplerianAngularVelocity(orbitalRadius);
    vec3 rotatedProjectedSamplePoint = rotateAround(projectedSamplePoint, localDiskNormal, theta);

    float angle = atan(rotatedProjectedSamplePoint.x, rotatedProjectedSamplePoint.z);
    float angle01 = fract(angle / TAU + 0.5);
    float u = intensity * 0.2 + 4.0 * relativeDistance;// some kind of disk coordinate (spiral)

    float noise = valueNoisePeriodicX(vec2(angle01 * 12.0, u), 12.0); // 1st octave
    noise = noise * 0.66 + 0.33 * valueNoisePeriodicX(vec2(angle01 * 24.0, u * 2.0), 24.0); // 2nd octave
    noise = pow(noise, 0.8);
    return max(0.2, noise);
}

float getDiskNoiseBlendWeight(float cycleFraction) {
    float fadeIn = smoothstep(0.0, 0.25, cycleFraction);
    float fadeOut = 1.0 - smoothstep(0.75, 1.0, cycleFraction);
    return fadeIn * fadeOut;
}

float sampleDiskNoiseWithBoundedShear(vec3 projectedSamplePoint, float relativeDistance, float intensity) {
    float cycleDuration = getDiskNoiseShearCycleDuration();
    float cycleFraction = fract(elapsedSeconds / cycleDuration);
    float primaryShearAge = cycleFraction * cycleDuration;
    float secondaryShearAge = fract(cycleFraction + 0.5) * cycleDuration;

    float primaryNoise = sampleDiskNoise(projectedSamplePoint, relativeDistance, intensity, primaryShearAge);
    float secondaryNoise = sampleDiskNoise(projectedSamplePoint, relativeDistance, intensity, secondaryShearAge);

    return mix(secondaryNoise, primaryNoise, getDiskNoiseBlendWeight(cycleFraction));
}

bool rayIntersectAccretionDiskSlab(vec3 rayOrigin, vec3 rayDir, out float tEnter, out float tExit) {
    if (abs(rayDir.y) < 1e-6) {
        if (abs(rayOrigin.y) > accretionDiskHeight) return false;

        tEnter = 0.0;
        tExit = accretionDiskHeight;
        return true;
    }

    float tBottom = (-accretionDiskHeight - rayOrigin.y) / rayDir.y;
    float tTop = (accretionDiskHeight - rayOrigin.y) / rayDir.y;

    tEnter = max(min(tBottom, tTop), 0.0);
    tExit = max(tBottom, tTop);

    return tExit >= tEnter;
}

vec4 raymarchDisk(vec3 rayDir, vec3 entryPoint, vec3 exitPoint) {
    if (!hasAccretionDisk) return vec4(0.0);// no disk

    vec3 samplePoint = entryPoint;
    float distanceToCenter = length(samplePoint);// distance to the center of the disk
    float relativeDistance = distanceToCenter / schwarzschildRadius;
    float relativeDiskRadius = accretionDiskRadius / schwarzschildRadius;

    vec3 projectedRayDir = vec3(rayDir.x, 0.0, rayDir.z);
    vec3 projectedEntryPoint = vec3(entryPoint.x, 0.0, entryPoint.z);

    vec3 deltaPos = vec3(1.0, 0.0, 0.0);
    if (length(projectedEntryPoint.xz) > 1e-6) {
        deltaPos = normalize(cross(localDiskNormal, projectedEntryPoint));
    }

    float parallel = dot(projectedRayDir, deltaPos);

    float redShift = (1.0 + parallel) / 2.0;

    float diskMix = smoothstep(0.3, 0.9, relativeDistance / relativeDiskRadius); // transition between inner and outer color
    vec3 innerDiskColor = vec3(1.0, 0.8, 0.1);
    vec3 outerDiskColor = vec3(0.5, 0.13, 0.02) * 0.2;
    vec3 insideCol =  mix(innerDiskColor, outerDiskColor, diskMix) * 1.25;

    vec3 redShiftMult = mix(vec3(1.6, 1.0, 2.0) * 3.0, vec3(0.4, 0.2, 0.1) * 0.5, redShift);//FIXME: need more realistic redshift
    insideCol *= redShiftMult;

    vec4 diskColor = vec4(0.0);
    for (float i = 0.0; i < DISK_STEPS; i++) {
        float raymarchFraction = (i + 0.5) / DISK_STEPS;
        samplePoint = mix(entryPoint, exitPoint, raymarchFraction);

        vec3 projectedSamplePoint = vec3(samplePoint.x, 0.0, samplePoint.z);

        float intensity = 1.0 - (i / DISK_STEPS);
        distanceToCenter = length(samplePoint);
        relativeDistance = distanceToCenter / schwarzschildRadius;

        float diskMask = 1.0;
        float photonSphereRelativeRadius = 1.5;
        diskMask *= smoothstep(photonSphereRelativeRadius, 2.5, relativeDistance); // Fade the disk when inside the photon sphere.
        diskMask *= clamp(1.0 - relativeDistance / relativeDiskRadius, 0.0, 1.0); //smoothstep(0.0, 1.0, relativeDiskRadius - relativeDistance);// The 2.0 is only for aesthetics

        // Inner disk material moves faster than outer material, but the sheared noise is recycled before it degenerates into radial high frequency noise.
        float noise = sampleDiskNoiseWithBoundedShear(projectedSamplePoint, relativeDistance, intensity);

        float alpha = diskMask * noise * intensity;

        // blending with current color in the disk
        diskColor = mix(diskColor, vec4(insideCol * intensity, 1.0), alpha);
    }

    return diskColor;
}

/**
 * Bends the light ray toward the black hole according to its distance
 * The bending is tweaked to reach 0 when far enough so that we can skip some calculations
 */
vec3 bendRay(vec3 rayDir, vec3 blackholeDir, float distanceToCenter2, float maxBendDistance, float stepSize) {
    float bendForce = schwarzschildRadius / distanceToCenter2; //bending force (physical)
    bendForce -= schwarzschildRadius / (maxBendDistance * maxBendDistance); // bend force is 0 at maxBendDistance (non physical)
    bendForce = stepSize * max(0.0, bendForce); // multiply by step size, and clamp negative values
    return normalize(rayDir + bendForce * blackholeDir); //bend ray towards BH
}

float customLength(vec3 v) {
    float p = warpingMinkowskiFactor;
    return pow(pow(abs(v.x), p) + pow(abs(v.y), p) + pow(abs(v.z), p), 1.0 / p);
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)
    vec3 rayDirWorld = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);

    float maxBendDistance = max(accretionDiskRadius * 3.0, schwarzschildRadius * 15.0);

    float t0, t1;
    if(!rayIntersectSphere(camera_position, rayDirWorld, worldPosition, maxBendDistance, t0, t1)) {
        // the light ray will not be affected by the black hole, we can skip the calculations
        gl_FragColor = screenColor;
        return;
    }

    vec3 rayPositionBlackHoleSpace = worldToBlackHoleSpace(camera_position);// position of the camera in blackhole space
    vec3 rayDir = normalize(directionToBlackHoleSpace(rayDirWorld));

    bool suckedInBH = false;
    bool escapedBH = false;
    bool occluded = false;

    if (maximumDistance < length(rayPositionBlackHoleSpace)) occluded = true;

    vec4 accumulatedColor = vec4(0.0);

    if (!occluded) {
        for (int diskCrossingIndex = 0; diskCrossingIndex < 15; diskCrossingIndex++) {
            float distanceToCenter = 0.0;//distance to BH

            float projectedDistance = 0.0;

            float rayDirProjectedDistance = 0.0;

            for (int subStepIndex = 0; subStepIndex < 6; subStepIndex++) {
                //reduces tests for exit conditions (to minimise branching)
                distanceToCenter = customLength(rayPositionBlackHoleSpace);//distance to BH
                vec3 dirToBlackHole = -rayPositionBlackHoleSpace / distanceToCenter;//direction to BH
                float distanceToCenter2 = distanceToCenter * distanceToCenter;

                projectedDistance = abs(rayPositionBlackHoleSpace.y);
                rayDirProjectedDistance = max(abs(rayDir.y), 1e-6);

                float stepSize = 0.92 * projectedDistance / rayDirProjectedDistance;//conservative distance to disk (y==0)
                float farLimit = distanceToCenter * 0.5;//limit step size far from to BH
                float closeLimit = distanceToCenter * 0.1 + 0.05 * distanceToCenter2 / schwarzschildRadius;//limit step size close to BH
                stepSize = min(stepSize, min(farLimit, closeLimit));

                // Frame dragging computation below: (see https://www.shadertoy.com/view/sdjcWm)
                // Compute a vector in the direction of the BH's rotation
                vec3 pos_cross_pole_axis = cross(localDiskNormal, -dirToBlackHole);
                // Compute sin^2(latitude) of the current ray position
                float sin2_colatitude = length(pos_cross_pole_axis);
                sin2_colatitude = sin2_colatitude * sin2_colatitude;

                // the frame dragging rate is approximately proportional to 1/(r^2 * sin^2(colatitude)) (See: https://en.wikipedia.org/wiki/Frame-dragging)
                vec3 frameDragForce = frameDraggingFactor * schwarzschildRadius * schwarzschildRadius * normalize(pos_cross_pole_axis) * sin2_colatitude / distanceToCenter2;

                rayDir = bendRay(rayDir, dirToBlackHole, distanceToCenter2, maxBendDistance, stepSize);
                rayPositionBlackHoleSpace += stepSize * (rayDir - frameDragForce);

                if(hasAccretionDisk) {
                    // the distance in the unit of the schwarzschild radius
                    float relativeDistance = distanceToCenter / schwarzschildRadius;
                    // Fade disk emission near the horizon (the photon sphere has a radius of 1.5 * schwarzschild, so 1.0 is slightly below for artistic reasons: bloom leaks at the camera level)
                    float glowMask = smoothstep(1.0, 2.5, relativeDistance);
                    accumulatedColor += 0.5 * vec4(1.0, 0.9, 0.6, 1.0) * (stepSize / schwarzschildRadius) * glowMask / (relativeDistance * relativeDistance);
                }
            }

            if (distanceToCenter < schwarzschildRadius) {
                suckedInBH = true;
                break;
            } else if (distanceToCenter > schwarzschildRadius * 5000.0) {
                escapedBH = true;
                break;
            } else if (projectedDistance <= accretionDiskHeight) {
                float diskEnter = 0.0;
                float diskExit = 0.0;
                if (rayIntersectAccretionDiskSlab(rayPositionBlackHoleSpace, rayDir, diskEnter, diskExit)) {
                    vec3 diskEntryPoint = rayPositionBlackHoleSpace + diskEnter * rayDir;
                    vec3 diskExitPoint = rayPositionBlackHoleSpace + diskExit * rayDir;
                    vec4 diskCol = raymarchDisk(rayDir, diskEntryPoint, diskExitPoint);//render disk
                    rayPositionBlackHoleSpace = diskExitPoint;
                    accumulatedColor += diskCol * (1.0 - accumulatedColor.a);
                } else {
                    rayPositionBlackHoleSpace += accretionDiskHeight * rayDir / rayDirProjectedDistance;// fallback to avoid being stuck in the disk band
                }
            }

            if (suckedInBH || escapedBH) break;
        }
    }

    // getting the screen coordinate of the end of the bended ray
    vec3 rayEndWorldPosition = blackHoleSpaceToWorld(rayPositionBlackHoleSpace);
    vec2 uv = uvFromWorld(rayEndWorldPosition, camera_projection, camera_view);
    // check if there is an object occlusion
    vec3 pixelWorldPositionEndRay = worldFromUV(uv, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)

    float depthEndRay = texture2D(depthSampler, uv).r;// the depth corresponding to the pixel in the depth map
    for(int i = 0; i < 10; i++) {
        vec2 offset = (vec2(hash(float(i)), hash(float(i + 1))) - 0.5) * 0.01;
        depthEndRay = min(depthEndRay, texture2D(depthSampler, uv + offset).r);
    }
    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPointEndRay = (pixelWorldPositionEndRay - camera_position) * remap(depthEndRay, 0.0, 1.0, camera_near, camera_far);

    bool behindBH = dot(closestPointEndRay - camera_position, closestPointEndRay - worldPosition) >= 0.0;
    // checking for alignment: camera, object, blackhole in this order
    behindBH = behindBH && dot(closestPointEndRay - camera_position, worldPosition - camera_position) >= 0.0;

    vec4 bg = vec4(0.0);
    if(uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0 && behindBH) {
        bg = texture2D(textureSampler, uv);
    } else {
        rayDirWorld = normalize(directionToWorldSpace(rayDir));
        rayDirWorld = vec3(starfieldRotation * vec4(rayDirWorld, 1.0));
        rayDirWorld.z *= -1.0;
        bg = texture(starfieldTexture, rayDirWorld);
    }

    vec4 finalColor = vec4(1.0, 0.0, 0.0, 1.0);

    if (occluded) {
        finalColor = screenColor;
    } else if (suckedInBH) {
        finalColor = vec4(accumulatedColor.rgb * accumulatedColor.a, 1.0);
    } else if (escapedBH) {
        finalColor = vec4(bg.rgb * (1.0 - accumulatedColor.a) + accumulatedColor.rgb * accumulatedColor.a, 1.0);
    } else {
        finalColor = vec4(bg.rgb * (1.0 - accumulatedColor.a) + accumulatedColor.rgb * accumulatedColor.a, 1.0);
    }

    gl_FragColor = finalColor;
}
