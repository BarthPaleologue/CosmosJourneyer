precision highp float;

/* disable_uniformity_analysis */

// based on https://www.shadertoy.com/view/tsBXW3

#define DISK_STEPS 12.0//disk texture layers

varying vec2 vUV;

uniform float time;

#include "./utils/object.glsl";

uniform float accretionDiskRadius;
uniform float rotationPeriod;
uniform float warpingMinkowskiFactor;

//TODO: make these uniforms
const float accretionDiskHeight = 100.0;
const bool hasAccretionDisk = true;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

uniform sampler2D starfieldTexture;

uniform mat4 starfieldRotation;

#include "./utils/camera.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/uvFromWorld.glsl";

#include "./utils/rotateAround.glsl";

#include "./utils/rayIntersectSphere.glsl";

vec3 projectOnPlane(vec3 vector, vec3 planeNormal) {
    return vector - dot(vector, planeNormal) * planeNormal;
}

float angleBetweenVectors(vec3 a, vec3 b) {
    // the clamping is necessary to prevent undefined values when acos(x) has |x| > 1
    return acos(clamp(dot(normalize(a), normalize(b)), -1.0, 1.0));
}

float hash(float x) { return fract(sin(x) * 152754.742); }
float hash(vec2 x) { return hash(x.x + hash(x.y)); }

float valueNoise(vec2 p, float f) {
    float bl = hash(floor(p*f + vec2(0.0, 0.0)));
    float br = hash(floor(p*f + vec2(1.0, 0.0)));
    float tl = hash(floor(p*f + vec2(0.0, 1.0)));
    float tr = hash(floor(p*f + vec2(1.0, 1.0)));

    vec2 fr = fract(p*f);
    fr = (3. - 2.*fr)*fr*fr;
    float b = mix(bl, br, fr.x);
    float t = mix(tl, tr, fr.x);
    return mix(b, t, fr.y);
}

vec4 raymarchDisk(vec3 rayDir, vec3 initialPosition) {
    if (!hasAccretionDisk) return vec4(0.0);// no disk

    vec3 samplePoint = initialPosition;
    float distanceToCenter = length(samplePoint);// distance to the center of the disk
    float relativeDistance = distanceToCenter / object_radius;
    float relativeDiskRadius = accretionDiskRadius / object_radius;

    vec3 diskNormal = object_rotationAxis;

    vec3 projectedRayDir = projectOnPlane(rayDir, diskNormal);
    vec3 projectedInitialPosition = projectOnPlane(initialPosition, diskNormal);

    float projectionDistance = length(projectedRayDir - rayDir);// if the vector is parallel to the disk the the projection distance is near 0. We use it to increase the step size.

    float stepSize = 0.02 * distanceToCenter / projectionDistance;//FIXME: this is not correct, but it works

    samplePoint += stepSize * rayDir;//FIXME: somehow when I remove this line, the disk has no thickness

    // elementary rotation around the hole
    vec3 deltaPos = rotateAround(projectedInitialPosition, diskNormal, 0.01);
    deltaPos = normalize(deltaPos - projectedInitialPosition);

    float parallel = dot(projectedRayDir, deltaPos);

    float redShift = (1.0 + parallel) / 2.0;

    float diskMix = smoothstep(0.6, 0.9, relativeDistance / relativeDiskRadius);// transition between inner and outer color
    vec3 innerDiskColor = vec3(1.0, 0.8, 0.1);
    vec3 outerDiskColor = vec3(0.5, 0.13, 0.02) * 0.2;
    vec3 insideCol =  mix(innerDiskColor, outerDiskColor, diskMix);

    vec3 redShiftMult = mix(vec3(1.6, 1.0, 2.0) * 3.0, vec3(0.4, 0.2, 0.1) * 0.5, redShift);//FIXME: need more realistic redshift
    insideCol *= redShiftMult;

    vec4 diskColor = vec4(0.0);
    for (float i = 0.0; i < DISK_STEPS; i++) {
        samplePoint -= stepSize * rayDir / DISK_STEPS;

        vec3 projectedSamplePoint = projectOnPlane(samplePoint, diskNormal);

        float intensity = 1.0 - (i / DISK_STEPS);
        distanceToCenter = length(samplePoint);
        relativeDistance = distanceToCenter / object_radius;

        float diskMask = 1.0;
        diskMask *= clamp(relativeDistance - 1.2, 0.0, 1.0);// The 1.2 is only for aesthetics
        diskMask *= smoothstep(0.0, 2.0, relativeDiskRadius - relativeDistance);// The 2.0 is only for aesthetics

        // rotation of the disk
        float theta = -2.0 * 3.1415 * time / rotationPeriod;
        vec3 rotatedProjectedSamplePoint = rotateAround(projectedSamplePoint, diskNormal, theta);

        float angle = angleBetweenVectors(rotatedProjectedSamplePoint, vec3(0.0, 0.0, 1.0));
        float u = time + intensity + relativeDistance;// some kind of disk coordinate (spiral)
        const float f = 1.0;
        float noise = valueNoise(vec2(2.0 * angle, 5.0 * u), f);
        noise = noise * 0.66 + 0.33 * valueNoise(vec2(2.0 * angle, 5.0 * u), f * 2.0);

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
    float bendForce = object_radius / distanceToCenter2; //bending force
    bendForce -= object_radius / (maxBendDistance * maxBendDistance); // bend force is 0 at maxBendDistance
    bendForce = stepSize * max(0.0, bendForce); // multiply by step size, and clamp negative values
    return normalize(rayDir + bendForce * blackholeDir); //bend ray towards BH
}

float customLength(vec3 v) {
    float p = warpingMinkowskiFactor;
    return pow(pow(abs(v.x), p) + pow(abs(v.y), p) + pow(abs(v.z), p), 1.0 / p);
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color
    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, depth, camera_inverseProjectionView);// the pixel position in world space (near plane)
    vec3 rayDir = normalize(worldFromUV(vUV, 1.0, camera_inverseProjectionView) - camera_position);// normalized direction of the ray

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position);

    float maxBendDistance = max(accretionDiskRadius * 3.0, object_radius * 15.0);

    float t0, t1;
    if(!rayIntersectSphere(camera_position, rayDir, object_position, maxBendDistance, t0, t1)) {
        // the light ray will not be affected by the black hole, we can skip the calculations
        gl_FragColor = screenColor;
        return;
    }

    vec4 colOut = vec4(0.0);

    vec3 rayPositionBlackHoleSpace = camera_position - object_position;// position of the camera in blackhole space

    bool suckedInBH = false;
    bool escapedBH = false;
    bool occluded = false;

    if (maximumDistance < length(rayPositionBlackHoleSpace)) occluded = true;

    vec4 col = vec4(0.0);
    vec4 glow = vec4(0.0);

    if (!occluded) {
        for (int disks = 0; disks < 15; disks++) {
            float distanceToCenter = 0.0;//distance to BH

            vec3 projectedPosition = vec3(0.0);
            float projectedDistance = 0.0;

            vec3 projectedRayDir = vec3(0.0);
            float rayDirProjectedDistance = 0.0;

            for (int h = 0; h < 6; h++) {
                //reduces tests for exit conditions (to minimise branching)
                distanceToCenter = customLength(rayPositionBlackHoleSpace);//distance to BH
                vec3 blackholeDir = -rayPositionBlackHoleSpace / distanceToCenter;//direction to BH
                float distanceToCenter2 = distanceToCenter * distanceToCenter;

                projectedPosition = projectOnPlane(rayPositionBlackHoleSpace, object_rotationAxis);
                projectedDistance = length(projectedPosition - rayPositionBlackHoleSpace);

                projectedRayDir = projectOnPlane(rayDir, object_rotationAxis);
                rayDirProjectedDistance = length(projectedRayDir - rayDir);

                float stepSize = 0.92 * projectedDistance / rayDirProjectedDistance;//conservative distance to disk (y==0)
                float farLimit = distanceToCenter * 0.5;//limit step size far from to BH
                float closeLimit = distanceToCenter * 0.1 + 0.05 * distanceToCenter2 / object_radius;//limit step size close to BH
                stepSize = min(stepSize, min(farLimit, closeLimit));

                rayDir = bendRay(rayDir, blackholeDir, distanceToCenter2, maxBendDistance, stepSize);
                rayPositionBlackHoleSpace += stepSize * rayDir;

                //TODO: improve glow
                //glow += vec4(1.2,1.1,1, 1.0) * (0.2 * (object_radius / distanceToCenter2) * stepSize * clamp(distanceToCenter / object_radius - 1.2, 0.0, 1.0)); //adds fairly cheap glow
            }

            if (distanceToCenter < object_radius) {
                suckedInBH = true;
                break;
            } else if (distanceToCenter > object_radius * 5000.0) {
                escapedBH = true;
                break;
            } else if (projectedDistance <= accretionDiskHeight) {
                //ray hit accretion disk //FIXME: Break when rotate around edge of disk
                vec4 diskCol = raymarchDisk(rayDir, rayPositionBlackHoleSpace);//render disk
                rayPositionBlackHoleSpace += accretionDiskHeight * rayDir / rayDirProjectedDistance;// we get out of the disk
                col += diskCol * (1.0 - col.a);
            }

            if (suckedInBH || escapedBH) break;
        }
    }

    // getting the screen coordinate of the end of the bended ray
    vec2 uv = uvFromWorld(rayPositionBlackHoleSpace + object_position, camera_projection, camera_view);
    float depthEndRay = texture2D(depthSampler, uv).r;// the depth corresponding to the pixel in the depth map
    // check if there is an object occlusion
    vec3 pixelWorldPositionEndRay = worldFromUV(uv, depthEndRay, camera_inverseProjectionView);// the pixel position in world space (near plane)
    vec3 rayDirToEndRay = normalize(pixelWorldPositionEndRay - camera_position);// normalized direction of the ray

    for(int i = 0; i < 10; i++) {
        vec2 offset = (vec2(hash(float(i)), hash(float(i + 1))) - 0.5) * 0.01;
        depthEndRay = min(depthEndRay, texture2D(depthSampler, uv + offset).r);
    }
    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPointEndRay = pixelWorldPositionEndRay - camera_position;
    float maximumDistanceEndRay = length(closestPointEndRay);// the maxium ray length due to occlusion
    float BHDistance = length(camera_position - object_position);

    bool behindBH = dot(closestPointEndRay - camera_position, closestPointEndRay - object_position) >= 0.0;
    // checking for alignment: camera, object, blackhole in this order
    behindBH = behindBH && dot(closestPointEndRay - camera_position, object_position - camera_position) >= 0.0;

    vec4 bg = vec4(0.0);
    if(uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0 && behindBH) {
        bg = texture2D(textureSampler, uv);
    } else {
        rayDir = vec3(starfieldRotation * vec4(rayDir, 1.0));
        vec2 starfieldUV = vec2(
        sign(rayDir.z) * acos(rayDir.x / length(vec2(rayDir.x, rayDir.z))) / 6.28318530718,
        acos(rayDir.y) / 3.14159265359
        );
        bg = texture2D(starfieldTexture, starfieldUV);
        bg.rgb = pow(bg.rgb, vec3(2.2));
    }

    vec4 finalColor = vec4(1.0, 0.0, 0.0, 1.0);

    if (occluded) {
        finalColor = screenColor;
    } else if (suckedInBH) {
        finalColor = vec4(col.rgb * col.a, 1.0);
    } else if (escapedBH) {
        finalColor = vec4(mix(bg.rgb, col.rgb + glow.rgb *(col.a +  glow.a), col.a), 1.0);
    } else {
        finalColor = vec4(col.rgb + glow.rgb *(col.a +  glow.a), 1.0);
    }

    gl_FragColor = finalColor;
}
