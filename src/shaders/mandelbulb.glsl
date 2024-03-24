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

precision highp float;

// based on https://www.shadertoy.com/view/tsc3Rj and https://www.shadertoy.com/view/wdjGWR

varying vec2 vUV;

uniform float power;
uniform vec3 accentColor;
uniform float elapsedSeconds;
uniform float averageScreenSize;

#include "./utils/stars.glsl";

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

#include "./utils/object.glsl";

#include "./utils/camera.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/rayIntersectSphere.glsl";

#include "./utils/saturate.glsl";

#include "./utils/pbr.glsl";

#define MARCHINGITERATIONS 64
#define MANDELBROTSTEPS 15

// cosine based palette, 4 vec3 params
vec3 cosineColor(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
    return a + b * cos(6.28318*(c*t+d));
}
vec3 palette (float t) {
    return cosineColor(t, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(0.07, 0.07, 0.07), accentColor);
}

// distance estimator to a mandelbulb set
// returns the distance to the set on the x coordinate 
// and the color on the y coordinate
vec2 distanceEstimator(vec3 pos) {
    float Power = power + 4.0 * sin(elapsedSeconds * 0.1);
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    for (int i = 0; i < MANDELBROTSTEPS; i++) {
        r = length(z);
        if (r > 1.5) break;

        // convert to polar coordinates
        float theta = acos(z.z / r);
        float phi = atan(z.y, z.x);
        dr = pow(r, Power - 1.0) * Power * dr + 1.0;

        // scale and rotate the point
        float zr = pow(r, Power);
        theta *= Power;
        phi *= Power;

        // convert back to cartesian coordinates
        z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
        z += pos;
    }

    float distance = 0.5 * log(r) * r / dr;
    float colorIndex = 50.0 * pow(dr, 0.128 / float(MARCHINGITERATIONS));

    return vec2(distance, colorIndex);
}

float contrast(float val, float contrast_offset, float contrast_mid_level)
{
    return clamp((val - contrast_mid_level) * (1. + contrast_offset) + contrast_mid_level, 0., 1.);
}


vec2 rayMarch(vec3 rayOrigin, vec3 rayDir, float initialDepth, out float steps) {
    float currentDepth = initialDepth;
    float newDistance = initialDepth;
    float stepSizeFactor = 1.3;
    float oldDistance = 0.0;
    float stepSize = 0.0;
    float cerr = 10000.0;
    float ct = 0.0;
    float pixradius = 1.0 / averageScreenSize;
    float color = 0.0;
    int inter = 0;
    for (int i = 0; i < MARCHINGITERATIONS; i++) {
        steps = float(i);
        oldDistance = newDistance;
        vec2 distanceData = distanceEstimator(rayOrigin + rayDir * currentDepth);
        newDistance = distanceData.x;        
        color += distanceData.y;

        //Detect intersections missed by over-relaxation
        if(stepSizeFactor > 1.0 && abs(oldDistance) + abs(newDistance) < stepSize){
            stepSize -= stepSizeFactor * stepSize;
            stepSizeFactor = 1.0;
            currentDepth += stepSize;
            continue;
        }
        stepSize = stepSizeFactor * newDistance;
        
        float err = newDistance / currentDepth;
        
        if(abs(err) < abs(cerr)){
            ct = currentDepth;
            cerr = err;
        }
        
        //Intersect when d / t < one pixel
        if(abs(err) < pixradius) {
            inter = 1;
            break;
        }
        
        currentDepth += stepSize;

        /*if(currentDepth > 30.0){
            break;
        }*/
    }
    if(inter == 0){
        ct = -1.0;
    }
    return vec2(ct, color);
}

float map(vec3 p){
    return distanceEstimator(p).x;
}

//Approximate normal
vec3 getNormal(vec3 p){
    return normalize(vec3(map(vec3(p.x + 0.0001, p.yz)) - map(vec3(p.x - 0.0001, p.yz)),
                          map(vec3(p.x, p.y + 0.0001, p.z)) - map(vec3(p.x, p.y - 0.0001, p.z)),
                	      map(vec3(p.xy, p.z + 0.0001)) - map(vec3(p.xy, p.z - 0.0001))));
}

//Determine if a point is in shadow - 1.0 = not in shadow
float getShadow(vec3 rayOrigin, vec3 rayDir, vec3 starPosition) {
    float t = 0.01;
    float d = 0.0;
    float shadow = 1.0;
    for(int iter = 0; iter < 64; iter++){
        d = map(rayOrigin + rayDir * t);
        if(d < 0.0001){
            return 0.5;
        }
        if(t > length(rayOrigin - starPosition) - 0.5){
            break;
        }
        shadow = min(shadow, 32.0 * d / t);
        t += d;
    }
    return 0.5 + 0.5 * shadow;
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, depth, camera_inverseProjectionView);// the pixel position in world space (near plane)

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position);

    vec3 rayDir = normalize(worldFromUV(vUV, 1.0, camera_inverseProjectionView) - camera_position);

    float impactPoint, escapePoint;
    if (!(rayIntersectSphere(camera_position, rayDir, object_position, object_radius * object_scaling_determinant, impactPoint, escapePoint))) {
        gl_FragColor = screenColor;
        return;
    }

    // scale down so that everything happens in a sphere of radius 2
    float inverseScaling = 2.0 / (1.0 * object_radius * object_scaling_determinant);

    vec3 origin = camera_position - object_position; // the ray origin in world space
    origin *= inverseScaling;

    float steps;
    vec2 rayInfo = rayMarch(origin, rayDir, max(impactPoint, 0.0) * inverseScaling, steps);
    float rayDepth = rayInfo.x;
    float rayColor = rayInfo.y;
    if(rayDepth == -1.0){
        gl_FragColor = screenColor;
        return;
    }

    vec3 intersectionPoint = origin + rayDepth * rayDir;

    vec3 intersectionPointW = object_position + intersectionPoint / inverseScaling;

    if(length(intersectionPointW - camera_position) > maximumDistance) {
        gl_FragColor = screenColor;
        return;
    }

    vec3 normal = getNormal(intersectionPoint);

    vec3 albedo = palette(rayColor * 0.01);
    float roughness = 0.4;
    float metallic = 0.2;
    vec3 viewDir = normalize(camera_position - intersectionPointW);

    vec3 color = vec3(0.0);
    for (int i = 0; i < nbStars; i++) {
        vec3 starDir = normalize(star_positions[i] - object_position);
        float shadow = getShadow(intersectionPoint, starDir, star_positions[i]);
        color += calculateLight(albedo, normal, roughness, metallic, starDir, viewDir, star_colors[i]) * shadow;
    }

    if(nbStars == 0) {
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        vec3 lightColor = vec3(1.0);
        float shadow = getShadow(intersectionPoint, lightDir, intersectionPoint + lightDir * 100.0);
        color += calculateLight(albedo, normal, roughness, metallic, lightDir, viewDir, lightColor) * shadow;
    }

    float ao = steps * 0.01;
    ao = 1.0 - ao / (ao + 0.5);// reinhard
    const float contrast_offset = 0.3;
    const float contrast_mid_level = 0.5;
    ao = contrast(ao, contrast_offset, contrast_mid_level);

    color = smoothstep(0.0, 0.8, color * 2.0) * 2.0;

    color *= (0.5 + 0.5 * ao);

    gl_FragColor = vec4(color, 1.0);
}
