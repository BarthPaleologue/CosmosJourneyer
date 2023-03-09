precision highp float;

// based on https://www.shadertoy.com/view/tsBXW3

#define DISK_STEPS 12.0 //disk texture layers

varying vec2 vUV;

uniform float time;
uniform float planetRadius;
uniform float accretionDiskRadius;
uniform float rotationPeriod;

const float accretionDiskHeight = 100.0;

uniform vec3 rotationAxis;

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

vec3 projectOnPlace(vec3 vector, vec3 planeNormal) {
    return vector - dot(vector, planeNormal) * planeNormal;
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
    const bool hasAccretionDisk = true; //TODO: make this a uniform
    if (!hasAccretionDisk) return vec4(0.0); // no disk

    vec3 samplePoint = initialPosition;
    float distanceToCenter = length(samplePoint); // distance to the center of the disk
    float relativeDistance = distanceToCenter / planetRadius;
    float relativeDiskRadius = accretionDiskRadius / planetRadius;

    vec3 diskNormal = rotationAxis;

    vec3 projectedRayDir = projectOnPlace(rayDir, diskNormal);
    vec3 projectedInitialPosition = projectOnPlace(initialPosition, diskNormal);

    float projectionDistance = length(projectedRayDir - rayDir); // if the vector is parallel to the disk the the projection distance is near 0. We use it to increase the step size.

    float stepSize = 0.02 * distanceToCenter / projectionDistance; //FIXME: this is not correct, but it works

    samplePoint += stepSize * rayDir; //FIXME: somehow when I remove this line, the disk has no height.

    // elementary rotation around the hole
    vec3 deltaPos = rotateAround(projectedInitialPosition, diskNormal, 0.01);
    deltaPos = normalize(deltaPos - projectedInitialPosition);

    float parallel = -dot(projectedRayDir, deltaPos);

    float redShift = (1.0 + parallel) / 2.0;

    float diskMix = smoothstep(3.5 / 6.0, 5.5 / 6.0, relativeDistance / relativeDiskRadius);
    vec3 innerDiskColor = vec3(1.0, 0.8, 0.0);
    vec3 outerDiskColor = vec3(0.5, 0.13, 0.02) * 0.2;
    vec3 insideCol =  mix(innerDiskColor, outerDiskColor, diskMix);

    vec3 redShiftMult = mix(vec3(0.4, 0.2, 0.1) * 0.5, vec3(1.6, 1.0, 8.0) * 3.0, redShift); //FIXME: need more realistic redshift
    insideCol *= redShiftMult;

    vec4 diskColor = vec4(0.0);
    for (float i = 0.0; i < DISK_STEPS; i++) {
        samplePoint -= stepSize * rayDir / DISK_STEPS;

        float intensity = 1.0 - (i / DISK_STEPS);
        distanceToCenter = length(samplePoint);
        relativeDistance = distanceToCenter / planetRadius;

        float diskMask = 1.0;
        diskMask *= clamp(relativeDistance - 1.2, 0.0, 1.0); //FIXME: why 1.2?
        diskMask *= smoothstep(0.0, 2.0, relativeDiskRadius - relativeDistance); // The 2.0 is only for aesthetics

        // rotation of the disk (2D rotation matrix)
        vec2 xz; //TODO: make this work with the rotation system
        float theta = 2.0 * 3.1415 * time / rotationPeriod;
        xz.x = samplePoint.x * cos(theta) - samplePoint.z * sin(theta);
        xz.y = samplePoint.x * sin(theta) + samplePoint.z * cos(theta);

        float angle = atan(abs(xz.x / (xz.y)));
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

void main()
{
    vec3 screenColor = texture2D(textureSampler, vUV).rgb;// the current screen color

    vec3 pixelWorldPosition = worldFromUV(vUV);// the pixel position in world space (near plane)
    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition);// normalized direction of the ray

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map
    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint);// the maxium ray length due to occlusion

    vec4 colOut = vec4(0.0);

    vec3 positionBHS = cameraPosition - planetPosition;// position of the camera in blackhole space

    if (maximumDistance < length(positionBHS)) {
        glFragColor = vec4(screenColor, 1.0);
        return;
    }

    vec4 col = vec4(0.0);

    for (int disks = 0; disks < 15; disks++) {
        float distanceToCenter = 0.0; //distance to BH
        
        vec3 projectedPosition = vec3(0.0);
        float projectedDistance = 0.0;

        vec3 projectedRayDir = vec3(0.0);
        float rayDirProjectedDistance = 0.0;

        for (int h = 0; h < 6; h++) {
            //reduces tests for exit conditions (to minimise branching)
            distanceToCenter = length(positionBHS); //distance to BH
            vec3 blackholeDir = -positionBHS / distanceToCenter; //direction to BH
            float distanceToCenter2 = distanceToCenter * distanceToCenter;

            projectedPosition = projectOnPlace(positionBHS, rotationAxis);
            projectedDistance = length(projectedPosition - positionBHS);

            projectedRayDir = projectOnPlace(rayDir, rotationAxis);
            rayDirProjectedDistance = length(projectedRayDir - rayDir);
            
            float stepSize = 0.92 * projectedDistance / rayDirProjectedDistance; //conservative distance to disk (y==0)
            float farLimit = distanceToCenter * 0.5; //limit step size far from to BH
            float closeLimit = distanceToCenter * 0.1 + 0.05 * distanceToCenter2 / planetRadius; //limit step size close to BH
            stepSize = min(stepSize, min(farLimit, closeLimit));

            float bendForce = stepSize * planetRadius / distanceToCenter2; //bending force
            rayDir = normalize(rayDir + bendForce * blackholeDir); //bend ray towards BH
            positionBHS += stepSize * rayDir;
        }

        if (distanceToCenter < planetRadius) {
            //ray sucked in to BH
            glFragColor =  vec4(col.rgb * col.a, 1.0);
            return;
        } else if (distanceToCenter > planetRadius * 10000.0) {
            //ray escaped BH
            
            /*vec2 uv = uvFromWorld(positionBHS);
            vec4 bg = vec4(0.0);

            if(uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) bg = texture2D(textureSampler, uv);
            else {*/
            vec2 starfieldUV = vec2(
                sign(rayDir.z) * acos(rayDir.x / length(vec2(rayDir.x, rayDir.z))) / 6.28318530718,
                acos(rayDir.y) / 3.14159265359
            );
            vec4 bg = texture2D(starfieldTexture, starfieldUV);
            //}

            glFragColor = vec4(mix(bg.rgb, col.rgb, col.a), 1.0);
            return;
        } else if (projectedDistance <= accretionDiskHeight) {
            //ray hit accretion disk //FIXME: Break when rotate around edge of disk
            vec4 diskCol = raymarchDisk(rayDir, positionBHS);//render disk
            //vec4 diskCol = raymarchDisk(rayDir, positionBHS);//render disk
            positionBHS += 10.0 * accretionDiskHeight * rayDir / rayDirProjectedDistance; // we get out of the disk
            col += diskCol * (1.0 - col.a);
        }
    }

    gl_FragColor = vec4(col.rgb, 1.0);
}
