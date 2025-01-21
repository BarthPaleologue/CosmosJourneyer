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

#include "./utils/stars.glsl";

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

#include "./utils/object.glsl";

#include "./utils/camera.glsl";

#include "./utils/remap.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/rayIntersectSphere.glsl";

#include "./utils/saturate.glsl";

#include "./utils/pbr.glsl";

#define MARCHINGITERATIONS 32

#define MARCHINGSTEP 1.0
#define EPSILON 0.001

#define MAXMANDELBROTDIST 3.0
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
vec2 sdf(vec3 pos) {
    float Power = power + 4.0 * sin(elapsedSeconds * 0.1);
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    for (int i = 0; i < MANDELBROTSTEPS; i++) {
        r = length(z);
        if (r > MAXMANDELBROTDIST) break;

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

// TRACING A PATH : 
// measuring the distance to the nearest object on the x coordinate
// and returning the color index on the y coordinate
vec2 rayMarch(vec3 origin, vec3 ray, out float steps) {
    //t is the point at which we are in the measuring of the distance
    float depth = 0.0;
    steps = 0.0;
    float c = 0.0;

    for (int i = 0; i < MARCHINGITERATIONS; i++) {
        vec3 path = origin + ray * depth;
        vec2 dist = sdf(path);
        // we want t to be as large as possible at each step but not too big to induce artifacts
        depth += MARCHINGSTEP * dist.x;
        c += dist.y;
        steps++;
    }

    return vec2(depth, c);
}

float contrast(float val, float contrast_offset, float contrast_mid_level)
{
    return clamp((val - contrast_mid_level) * (1. + contrast_offset) + contrast_mid_level, 0., 1.);
}

float map(vec3 p){
    return sdf(p).x;
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

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)
    vec3 rayDir = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map
    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);

    float impactPoint, escapePoint;
    if (!(rayIntersectSphere(camera_position, rayDir, object_position, object_radius * object_scaling_determinant, impactPoint, escapePoint))) {
        gl_FragColor = screenColor;// if not intersecting with atmosphere, return original color
        return;
    }

    // scale down so that everything happens in a sphere of radius 2
    float inverseScaling = 1.0 / (0.5 * object_radius * object_scaling_determinant);

    vec3 origin = camera_position + rayDir * impactPoint - object_position; // the ray origin in world space
    origin *= inverseScaling;

    float steps;
    vec2 mandelDepth = rayMarch(origin, rayDir, steps);

    float realDepth = impactPoint + mandelDepth.x / inverseScaling;

    if (maximumDistance < realDepth) {
        gl_FragColor = screenColor;
        return;
    }

    vec3 intersectionPoint = origin + mandelDepth.x * rayDir;

    // compute normal and anti-aliasing at the same time
    vec3 p = intersectionPoint;
    float delta = EPSILON * 2.0;
    vec2 x1 = sdf(vec3(p.x + delta, p.y, p.z));
    vec2 x2 = sdf(vec3(p.x - delta, p.y, p.z));
    vec2 y1 = sdf(vec3(p.x, p.y + delta, p.z));
    vec2 y2 = sdf(vec3(p.x, p.y - delta, p.z));
    vec2 z1 = sdf(vec3(p.x, p.y, p.z + delta));
    vec2 z2 = sdf(vec3(p.x, p.y, p.z - delta));

    mandelDepth += x1 + x2 + y1 + y2 + z1 + z2;
    mandelDepth /= 7.0;

    intersectionPoint = origin + mandelDepth.x * rayDir;

    vec3 intersectionPointW = object_position + intersectionPoint / inverseScaling;

    float intersectionDistance = length(intersectionPoint);

    vec3 albedo = palette(mandelDepth.y);
    float roughness = 0.5;
    float metallic = 0.5;
    vec3 viewDir = normalize(camera_position - intersectionPointW);

    vec3 normal = normalize(vec3(
        x1.x - x2.x,
        y1.x - y2.x,
        z1.x - z2.x
    ));
    
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

    gl_FragColor = mix(vec4(color, 1.0), screenColor, smoothstep(2.0, 15.0, intersectionDistance));

}
