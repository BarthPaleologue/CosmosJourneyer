//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

precision lowp float;

varying vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

uniform float time;

uniform mat4 inverseRotation;

#include "./utils/camera.glsl";

#include "./utils/object.glsl";

#include "./utils/rotateAround.glsl";

#include "./utils/remap.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/removeAxialTilt.glsl";

float sdSpiral(vec3 p) {
    float frequency = 2.0;
    
    // Y-axis is now the spiral direction
    float spiralPos = p.y; // Using Y instead of Z
    float radius = 0.2 * spiralPos;
    float theta = frequency * spiralPos - sign(spiralPos) * time * 20.0;
    
    // Spiral now wraps around Y-axis
    vec3 spiralPoint = vec3(
        radius * cos(theta),
        spiralPos,          // Y position is our spiral progress
        radius * sin(theta) // Z component completes the circular motion
    );
    
    return length(p - spiralPoint);
}

float spiralDensity(vec3 p) {    
    float dist = sdSpiral(p);
    
    float density = 0.0;
    float lengthDecay = 0.3;
    
    density += exp(-20.0 * dist*dist) *
               exp(-0.4 * dist) *
               exp(-lengthDecay * abs(p.y)); // Fade vertically
    
    return density;
}

// from https://www.shadertoy.com/view/MtcXWr
bool rayIntersectCone(vec3 rayOrigin, vec3 rayDir, vec3 conePosition, vec3 coneUp, float coneHeight, float cosTheta, out float tNear, out float tFar) {
    vec3 co = rayOrigin - conePosition;

    float a = dot(rayDir,coneUp)*dot(rayDir,coneUp) - cosTheta*cosTheta;
    float b = 2. * (dot(rayDir,coneUp)*dot(co,coneUp) - dot(rayDir,co)*cosTheta*cosTheta);
    float c = dot(co,coneUp)*dot(co,coneUp) - dot(co,co)*cosTheta*cosTheta;

    float det = b*b - 4.*a*c;
    if (det < 0.) return false;

    det = sqrt(det);
    float t1 = (-b - det) / (2. * a);
    float t2 = (-b + det) / (2. * a);

    // Determine which of the t, if any, is a solution:
    bool hitFound = false;
    vec3 cp;
    if (t1 >= 0.0)
    {
        vec3 cp1 = rayOrigin + t1 * rayDir - conePosition;
        float h = dot(cp1, coneUp);
        if (abs(h) <= coneHeight)
        {
            hitFound = true;
            tNear = t1;
            tFar = t2;
            cp = cp1;
        }
    }
    if (t2 >= 0.0 && (!hitFound || t2 < t1))
    {
        vec3 cp2 = rayOrigin + t2 * rayDir - conePosition;
        float h = dot(cp2, coneUp);
        if (abs(h) <= coneHeight)
        {
            hitFound = true;
            tNear = t2;
            tFar = t1;
            cp = cp2;
        }
    }

    return hitFound;

    //if (!hitFound) return false;

    /*vec3 n = normalize(cp * dot(coneUp, cp) / dot(cp, cp) - coneUp);

    return Hit(t, n, s.m);*/
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);

    vec3 rayDir = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

    vec4 finalColor = screenColor;

    
    // Keep the same raymarching parameters
    float t = 0.0;
    const float stepSize = 0.08;
    const int steps = 256;
    
    vec3 col = vec3(0.0);
    float transmittance = 1.0;

    vec3 rayOriginLocalSpace = mat3(inverseRotation) * (camera_position - object_position);

    vec3 rayDirLocalSpace = mat3(inverseRotation) * rayDir;

    vec3 ro = rayOriginLocalSpace / object_radius;
    vec3 rd = rayDirLocalSpace;
    
    /*for(int i = 0; i < 1; i++) {
        float dist = sdSpiral(ro + rd * t);
        t += dist;

        if(dist < 1.0) {
            break;
        }
    }*/

    //t += sdSpiral(ro);
    float t1, t2;

    if(rayIntersectCone(ro, rd, vec3(0.0), vec3(0.0, 1.0, 0.0), 100.0, cos(0.5), t1, t2)) {
        vec3 startPoint = ro + t1 * rd;

        int nbSteps = 100;
        float stepSize = (t2 - t1) / float(nbSteps);

        for(int i = 0; i < nbSteps; i++) {
            vec3 p = startPoint + float(i) * stepSize * rd;

            float density = spiralDensity(p) * 100.0;
        
            vec3 emission = vec3(0.3, 0.6, 1.0) * density;
            float absorption = 0.2 * density;
        
            transmittance *= exp(-absorption * stepSize);
            col += emission * transmittance * stepSize;
        }

        gl_FragColor = vec4(col, 1.0);// displaying the final color
        return;
    }

    for(int i = 0; i < steps; i++) {
        vec3 p = ro + rd * t;

        if(length(p) < 1.0) {
            transmittance = 1.0;
            break;
        }

        float density = spiralDensity(p) * 100.0;
        
        vec3 emission = vec3(0.3, 0.6, 1.0) * density;
        float absorption = 0.2 * density;
        
        transmittance *= exp(-absorption * stepSize);
        col += emission * transmittance * stepSize;
        
        t += stepSize;
        if(transmittance < 0.01 || t > 20.0) break;
    }
    
    //col *= exp(-0.05 * t);
    col = pow(col, vec3(0.4545));

    col = mix(col, screenColor.rgb, transmittance);

    
/*
    const float jetHeight = 10000000e3;
    const vec3 jetColor = vec3(0.5, 0.5, 1.0);


    float t1, t2;
    if (rayIntersectCone(camera_position, rayDir, object_position, object_rotationAxis, 0.95, t1, t2)) {
        if (t2 > 0.0 && t2 < maximumDistance) {
            vec3 jetPointPosition2 = camera_position + t2 * rayDir - object_position;

            float density2 = spiralDensity(jetPointPosition2, object_rotationAxis, jetHeight);

            finalColor.rgb = mix(finalColor.rgb, jetColor, density2);
        }
        if (t1 > 0.0 && t1 < maximumDistance) {
            vec3 jetPointPosition1 = camera_position + t1 * rayDir - object_position;

            float density1 = spiralDensity(jetPointPosition1, object_rotationAxis, jetHeight);

            finalColor.rgb = mix(finalColor.rgb, jetColor, density1);
        }
    }
*/
    gl_FragColor = vec4(col, 1.0);// displaying the final color
}