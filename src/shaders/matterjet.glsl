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

uniform float dipoleTilt;

#include "./utils/camera.glsl";

#include "./utils/object.glsl";

#include "./utils/rotateAround.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/removeAxialTilt.glsl";

float sdSpiral(vec3 p, float coneTheta, float frequency) {    
    // Y-axis is now the spiral direction
    float spiralPos = p.y; // Using Y instead of Z
    float radius = spiralPos * tan(coneTheta);
    float theta = frequency * spiralPos;
    
    // Spiral now wraps around Y-axis
    vec3 spiralPoint = vec3(
        radius * cos(theta),
        spiralPos,          // Y position is our spiral progress
        radius * sin(theta) // Z component completes the circular motion
    );
    
    return length(p - spiralPoint);
}

float spiralDensity(vec3 p, float coneTheta, float coneHeight) {    
    float frequency = 0.1;
    float dist = sdSpiral(p, coneTheta, frequency);
    
    float heightFraction = abs(p.y) / coneHeight;

    dist /= heightFraction;

    float density = 1.0;

    density *= exp(-0.02 * dist * dist);
    
    density *= 1.0 - smoothstep(0.0, 1.0, heightFraction);

    density /= heightFraction;
    
    return density;
}

// from https://www.shadertoy.com/view/MtcXWr
// Returns true if the ray intersects the closed cone.
// If so, 't' is set to the first hit along the ray (entry if outside, exit if inside)
// and 'distTrough' is set to the chord length of the ray inside the cone.
bool rayIntersectCone(vec3 rayOrigin, vec3 rayDir,
                      float coneHeight, float cosTheta,
                      out float t, out float distTrough)
{
    vec3 coneUp = vec3(0.0, 1.0, 0.0);

    float cosTheta2 = cosTheta * cosTheta;

    // Compute tangent once.
    float sinTheta = sqrt(max(0.0, 1.0 - cosTheta2));
    float tanTheta = sinTheta / cosTheta;

    // --- Determine if ray origin is inside the cone volume ---
    bool inside = false;
    {
        vec3 v = rayOrigin;
        float h = v.y;
        if (h >= 0.0 && h <= coneHeight) {
            float rAtH = h * tanTheta;
            float d = length(v - coneUp * h);
            if (d <= rAtH)
                inside = true;
        }
    }
    
    // --- Collect candidate intersection t's ---
    // We will add valid intersections from the lateral surface and the base.
    float tCandidates[3];
    int count = 0;
    
    // Intersection with the infinite cone's lateral surface.
    vec3 co = rayOrigin;
    float A = rayDir.y * rayDir.y - cosTheta2;
    float B = 2.0 * (rayDir.y * co.y - dot(rayDir, co) * cosTheta2);
    float C = co.y * co.y - dot(co, co) * cosTheta2;
    
    float det = B * B - 4.0 * A * C;
    if (det >= 0.0)
    {
        float sqrtDet = sqrt(det);
        float t1 = (-B - sqrtDet) / (2.0 * A);
        float t2 = (-B + sqrtDet) / (2.0 * A);
        
        // Check t1 for validity (only consider if t>=0)
        if (t1 >= 0.0)
        {
            vec3 cp1 = rayOrigin + t1 * rayDir;
            float h1 = cp1.y;
            if (h1 >= 0.0 && h1 <= coneHeight)
                tCandidates[count++] = t1;
        }
        // Check t2
        if (t2 >= 0.0)
        {
            vec3 cp2 = rayOrigin + t2 * rayDir;
            float h2 = cp2.y;
            if (h2 >= 0.0 && h2 <= coneHeight)
                tCandidates[count++] = t2;
        }
    }
    
    // Intersection with the base plane.
    vec3 baseCenter = coneUp * coneHeight;
    float denom = rayDir.y;
    if (abs(denom) > 1e-6)
    {
        float tBase = (baseCenter - rayOrigin).y / denom;
        if (tBase >= 0.0)
        {
            vec3 hitPoint = rayOrigin + tBase * rayDir;
            // Check if hitPoint is within the circular base.
            float baseRadius = coneHeight * tanTheta;
            if (length(hitPoint - baseCenter) <= baseRadius)
                tCandidates[count++] = tBase;
        }
    }
    
    // If no valid intersections were found, return false.
    if (count == 0)
        return false;
    
    // --- Sort the candidate intersections in increasing order ---
    for (int i = 0; i < count - 1; i++)
    {
        for (int j = i + 1; j < count; j++)
        {
            if (tCandidates[j] < tCandidates[i])
            {
                float tmp = tCandidates[i];
                tCandidates[i] = tCandidates[j];
                tCandidates[j] = tmp;
            }
        }
    }
    
    // --- Determine entry and exit t values ---
    float tEntry, tExit;
    if (inside)
    {
        // If the ray origin is inside, entry is at t = 0 and the exit is the first candidate.
        tEntry = 0.0;
        tExit  = tCandidates[0];
    }
    else
    {
        // Outside: entry is the first hit, exit is the second (if present).
        tEntry = tCandidates[0];
        if (count > 1)
            tExit = tCandidates[1];
        else
            tExit = tEntry; // Tangential hit: chord length is zero.
    }
    
    // Set the outputs.
    // We return tEntry as the “hit” point (for an outside ray, where the ray first enters the cone;
    // for an inside ray, tEntry=0 is the starting point so we return the exit instead).
    if (inside)
        t = 0.0;
    else
        t = tEntry;
    
    distTrough = tExit - tEntry;
    
    return true;
}

vec3 rayMarchSpiral(vec3 rayOrigin, vec3 rayDir, float distThrough, int nbSteps, float coneTheta, float coneHeight, out float transmittance) {
    vec3 col = vec3(0.0);
    
    transmittance = 1.0;
    
    float stepSize = distThrough / float(nbSteps);

    for(int i = 0; i < nbSteps; i++) {
        vec3 p = rayOrigin + float(i) * stepSize * rayDir;

        float density = spiralDensity(p, coneTheta * 0.7, coneHeight);
    
        vec3 emission = 3.0 * vec3(0.3, 0.6, 1.0) * density;
        float absorption = 0.2 * density;
    
        transmittance *= exp(-absorption * stepSize);
        col += emission * transmittance * stepSize;
    }

    return col;
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, depth, camera_inverseProjectionView);// the pixel position in world space (near plane)

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position);

    vec3 rayDir = normalize(worldFromUV(vUV, 1.0, camera_inverseProjectionView) - camera_position);// normalized direction of the ray

    float scaling_factor = object_radius * 10000.0;

    // move in object's local space to simplify the calculations
    vec3 rayOriginLocalSpace = mat3(inverseRotation) * (camera_position - object_position) / scaling_factor;
    vec3 rayDirLocalSpace = mat3(inverseRotation) * rayDir;

    float coneTheta = dipoleTilt;
    float coneHeight = 100.0;

    vec3 color = screenColor.rgb;
    float finalAlpha = screenColor.a;

    float t, distThrough;
    if(rayIntersectCone(rayOriginLocalSpace, rayDirLocalSpace, coneHeight, cos(coneTheta + sign(coneTheta) * 0.2), t, distThrough) && t * scaling_factor < maximumDistance) {
        vec3 startPoint = rayOriginLocalSpace + t * rayDirLocalSpace;

        float transmittance;
        vec3 jetColor = rayMarchSpiral(startPoint, rayDirLocalSpace, distThrough, 100, coneTheta, coneHeight, transmittance);

        color = mix(jetColor, color, transmittance);
        finalAlpha = max(transmittance, finalAlpha);
    }

    // flip the coordinates to display the other cone
    rayOriginLocalSpace *= -1.0;
    rayDirLocalSpace *= -1.0;

    if(rayIntersectCone(rayOriginLocalSpace, rayDirLocalSpace, coneHeight, cos(coneTheta + sign(coneTheta) * 0.2), t, distThrough) && t * scaling_factor < maximumDistance) {
        vec3 startPoint = rayOriginLocalSpace + t * rayDirLocalSpace;

        float transmittance;
        vec3 jetColor = rayMarchSpiral(startPoint, rayDirLocalSpace, distThrough, 100, coneTheta, coneHeight, transmittance);

        color = mix(jetColor, color, transmittance);
        finalAlpha = max(transmittance, finalAlpha);
    }

    gl_FragColor = vec4(color, finalAlpha);
}