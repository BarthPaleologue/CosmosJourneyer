precision highp float;

// based on https://www.shadertoy.com/view/tsBXW3

#define _Steps  12.0//disk texture layers

varying vec2 vUV;

uniform float time;
uniform float planetRadius;
uniform float accretionDiskRadius;
uniform float rotationPeriod;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

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

vec4 raymarchDisk(vec3 ray, vec3 zeroPos) {
    const bool hasAccretionDisk = true;
    if (!hasAccretionDisk) return vec4(0.0);//no disk

    vec3 position = zeroPos;
    float distance = length(position.xyz);// distance to the center of the disk
    float relativeDistance = distance / planetRadius;
    float relativeDiskSize = accretionDiskRadius / planetRadius;

    float dist = 0.02 * distance / abs(ray.y); //FIXME: this is not correct, but it works

    position += dist * ray;

    // elementary rotation around the hole //FIXME: will break when the black hole has a rotation
    vec2 deltaPos;
    deltaPos.x = zeroPos.x - zeroPos.z * 0.01;
    deltaPos.y = zeroPos.x * 0.01 + zeroPos.z;
    deltaPos = normalize(deltaPos - zeroPos.xz);

    float parallel = dot(ray.xz, deltaPos);

    float redShift = (1.0 + parallel) / 2.0;

    float diskMix = smoothstep(3.5 / 6.0, 5.5 / 6.0, relativeDistance / relativeDiskSize);
    vec3 innerDiskColor = vec3(1.0, 0.8, 0.0);
    vec3 outerDiskColor = vec3(0.5, 0.13, 0.02) * 0.2;
    vec3 insideCol =  mix(innerDiskColor, outerDiskColor, diskMix);

    vec3 redShiftMult = mix(vec3(0.4, 0.2, 0.1) * 0.5, vec3(1.6, 1.0, 8.0) * 3.0, redShift);//FIXME: need more realistic redshift
    insideCol *= redShiftMult;

    float relativeDiskRadius = accretionDiskRadius / planetRadius;

    vec4 diskColor = vec4(0.0);
    for (float i = 0.; i < _Steps; i++) {
        position -= dist * ray / _Steps;

        float intensity = 1.0 - (i / _Steps);
        distance = length(position.xyz);
        relativeDistance = distance / planetRadius;

        float distMult = 1.0;
        distMult *= clamp(relativeDistance - 1.2, 0.0, 1.0);
        distMult *= clamp(relativeDiskRadius - relativeDistance, 0.0, 1.0);

        // rotation of the disk
        vec2 xz;
        float rot = 2.0 * 3.1415 * time / rotationPeriod;
        xz.x = position.x * cos(rot) - position.z * sin(rot);
        xz.y = position.x * sin(rot) + position.z * cos(rot);

        float angle = atan(abs(xz.x / (xz.y)));
        float u = time + intensity + relativeDistance;// some kind of disk coordinate
        const float f = 1.0;
        float noise = valueNoise(vec2(2.0 * angle, 5.0 * u), f);
        noise = noise * 0.66 + 0.33 * valueNoise(vec2(2.0 * angle, 5.0 * u), f * 2.0);

        float alpha = distMult * noise * intensity; // The pow is only for aesthetics

        // blending with current color in the disk
        diskColor = mix(diskColor, vec4(insideCol * intensity, 1.0), alpha);
    }

    return diskColor;
}

void main()
{
    vec3 screenColor = texture2D(textureSampler, vUV).rgb;// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV);// the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint);// the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition);// normalized direction of the ray

    vec4 colOut = vec4(0.0);

    float accretionDiskHeight = 100.0;

    vec3 pos = cameraPosition - planetPosition;// position of the camera in blackhole space

    if (maximumDistance < length(pos)) {
        glFragColor = vec4(screenColor, 1.0);
        return;
    }

    vec4 col = vec4(0.0);

    for (int disks = 0; disks < 15; disks++) {
        for (int h = 0; h < 6; h++)//reduces tests for exit conditions (to minimise branching)
        {
            float centDist = length(pos);//dotpos * invDist;//distance to BH
            float dotpos = centDist * centDist;
            float invDist = 1.0 / centDist;//inversesqrt(dotpos);//1/distance to BH
            float stepDist = 0.92 * abs(pos.y / rayDir.y);//conservative distance to disk (y==0)
            float farLimit = centDist * 0.5;//limit step size far from to BH
            float closeLimit = centDist * 0.1 + 0.05 * dotpos / planetRadius;//limit step size close to BH
            stepDist = min(stepDist, min(farLimit, closeLimit));

            float invDistSqr = invDist * invDist;
            float bendForce = stepDist * invDistSqr * planetRadius;//bending force
            rayDir =  normalize(rayDir - bendForce * pos * invDist);//bend ray towards BH
            pos += stepDist * rayDir;
        }

        float dist2 = length(cameraPosition - pos);

        if (dist2 < planetRadius)//ray sucked in to BH
        {
            glFragColor =  vec4(col.rgb * col.a, 1.0);
            return;
        } else if (dist2 > planetRadius * 1000.)//ray escaped BH
        {
            if (maximumDistance < length(cameraPosition - pos)) {
                glFragColor = vec4(screenColor, 1.0);
                return;
            }
            vec2 uv = uvFromWorld(pos);
            vec4 bg = texture2D(textureSampler, uv);
            glFragColor = vec4(mix(bg.rgb, col.rgb, col.a), 1.0);
            return;
        } else if (abs(pos.y) <= accretionDiskHeight)//ray hit accretion disk //FIXME: Break when rotate
        {
            if (maximumDistance < length(cameraPosition - pos)) {
                glFragColor = vec4(screenColor, 1.0);
                return;
            }

            vec4 diskCol = raymarchDisk(rayDir, pos);//render disk
            pos += 10.0 * accretionDiskHeight * rayDir;
            col += diskCol * (1.0 - col.a);
        }
    }

    gl_FragColor = vec4(col.rgb, 1.0);
}
