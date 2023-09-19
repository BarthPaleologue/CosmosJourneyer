precision highp float;

// based on https://www.shadertoy.com/view/tsBXW3

#define DISK_STEPS 12.0 //disk texture layers

varying vec2 vUV;

uniform float time;
uniform float planetRadius;
uniform float accretionDiskRadius;
uniform float rotationPeriod;

//TODO: make these uniforms
const float accretionDiskHeight = 100.0;
const bool hasAccretionDisk = true;

uniform vec3 rotationAxis;
uniform vec3 forwardAxis;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

uniform sampler2D starfieldTexture;

uniform vec3 planetPosition;
uniform vec3 cameraPosition;

uniform mat4 view;
uniform mat4 projection;
uniform mat4 inverseView;
uniform mat4 inverseProjection;

uniform float cameraNear;
uniform float cameraFar;

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=inverseProjection, inverseView=inverseView)

#pragma glslify: uvFromWorld = require(./utils/uvFromWorld.glsl, projection=projection, view=view)

#pragma glslify: rotateAround = require(./utils/rotateAround.glsl)

#pragma glslify: rayIntersectSphere = require(./utils/rayIntersectSphere.glsl)

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
    if (!hasAccretionDisk) return vec4(0.0); // no disk

    vec3 samplePoint = initialPosition;
    float distanceToCenter = length(samplePoint); // distance to the center of the disk
    float relativeDistance = distanceToCenter / planetRadius;
    float relativeDiskRadius = accretionDiskRadius / planetRadius;

    vec3 diskNormal = rotationAxis;

    vec3 projectedRayDir = projectOnPlane(rayDir, diskNormal);
    vec3 projectedInitialPosition = projectOnPlane(initialPosition, diskNormal);

    float projectionDistance = length(projectedRayDir - rayDir); // if the vector is parallel to the disk the the projection distance is near 0. We use it to increase the step size.

    float stepSize = 0.02 * distanceToCenter / projectionDistance; //FIXME: this is not correct, but it works

    samplePoint += stepSize * rayDir; //FIXME: somehow when I remove this line, the disk has no height.

    // elementary rotation around the hole
    vec3 deltaPos = rotateAround(projectedInitialPosition, diskNormal, 0.01);
    deltaPos = normalize(deltaPos - projectedInitialPosition);

    float parallel = dot(projectedRayDir, deltaPos);

    float redShift = (1.0 + parallel) / 2.0;

    float diskMix = smoothstep(0.6, 0.9, relativeDistance / relativeDiskRadius); // transition between inner and outer color
    vec3 innerDiskColor = vec3(1.0, 0.8, 0.1);
    vec3 outerDiskColor = vec3(0.5, 0.13, 0.02) * 0.2;
    vec3 insideCol =  mix(innerDiskColor, outerDiskColor, diskMix);

    vec3 redShiftMult = mix(vec3(0.4, 0.2, 0.1) * 0.5, vec3(1.6, 1.0, 2.0) * 3.0, redShift); //FIXME: need more realistic redshift
    insideCol *= redShiftMult;

    vec4 diskColor = vec4(0.0);
    for (float i = 0.0; i < DISK_STEPS; i++) {
        samplePoint -= stepSize * rayDir / DISK_STEPS;

        vec3 projectedSamplePoint = projectOnPlane(samplePoint, diskNormal);

        float intensity = 1.0 - (i / DISK_STEPS);
        distanceToCenter = length(samplePoint);
        relativeDistance = distanceToCenter / planetRadius;

        float diskMask = 1.0;
        diskMask *= clamp(relativeDistance - 1.2, 0.0, 1.0); // The 1.2 is only for aesthetics
        diskMask *= smoothstep(0.0, 2.0, relativeDiskRadius - relativeDistance); // The 2.0 is only for aesthetics

        // rotation of the disk
        float theta = -2.0 * 3.1415 * time / rotationPeriod;
        vec3 rotatedProjectedSamplePoint = rotateAround(projectedSamplePoint, diskNormal, theta);
        
        float angle = angleBetweenVectors(rotatedProjectedSamplePoint, forwardAxis);
        float u = time + intensity + relativeDistance; // some kind of disk coordinate (spiral)
        const float f = 1.0;
        float noise = valueNoise(vec2(2.0 * angle, 5.0 * u), f);
        noise = noise * 0.66 + 0.33 * valueNoise(vec2(2.0 * angle, 5.0 * u), f * 2.0);

        float alpha = diskMask * noise * intensity;

        // blending with current color in the disk
        diskColor = mix(diskColor, vec4(insideCol * intensity, 1.0), alpha);
    }

    return diskColor;
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    vec3 pixelWorldPosition = worldFromUV(vUV);// the pixel position in world space (near plane)
    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition);// normalized direction of the ray

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map
    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint);// the maxium ray length due to occlusion

    vec4 outColor;

    float impactPoint, escapePoint;
    if (!(rayIntersectSphere(cameraPosition, rayDir, planetPosition, planetRadius, impactPoint, escapePoint))) {
        outColor = screenColor;// if not intersecting with atmosphere, return original color
    } else {
        outColor = vec4(1.0, 0.0, 0.0, 1.0);
    }

    gl_FragColor = outColor;
}
