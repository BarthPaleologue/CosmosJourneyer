//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

precision highp float;

// based on https://www.shadertoy.com/view/tsc3Rj and https://www.shadertoy.com/view/wdjGWR

varying vec2 vUV;

uniform float power;
uniform vec3 accentColor;

#include "./utils/stars.glsl";

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

#include "./utils/object.glsl";

#include "./utils/camera.glsl";

#include "./utils/remap.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/rayIntersectSphere.glsl";

#include "./utils/saturate.glsl";

#define MARCHINGITERATIONS 64

#define MARCHINGSTEP 1.0
#define EPSILON 0.001

#define MAXMANDELBROTDIST 3.0
#define MANDELBROTSTEPS 15

// cosine based palette, 4 vec3 params
vec3 cosineColor(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
    return a + b * cos(6.28318*(c*t+d));
}
vec3 palette (float t) {
    return cosineColor(t, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(0.01, 0.01, 0.01), accentColor);
}

// distance estimator to a mandelbulb set
// returns the distance to the set on the x coordinate 
// and the color on the y coordinate
vec2 sdf(vec3 pos) {
    float Power = power;
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    for (int i = 0; i < MANDELBROTSTEPS; i++) {
        r = length(z);
        if (r > MAXMANDELBROTDIST) break;
        if (r < EPSILON) break;

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
        if (dist.y < EPSILON) break;
    }

    return vec2(depth, c);
}

vec4 lerp(vec4 v1, vec4 v2, float t) {
    return t * v1 + (1.0 - t) * v2;
}

float contrast(float val, float contrast_offset, float contrast_mid_level)
{
    return clamp((val - contrast_mid_level) * (1. + contrast_offset) + contrast_mid_level, 0., 1.);
}

vec3 estimate_normal(const vec3 p, const float delta)
{
    vec3 normal = vec3(
    sdf(vec3(p.x + delta, p.y, p.z)).x - sdf(vec3(p.x - delta, p.y, p.z)).x,
    sdf(vec3(p.x, p.y + delta, p.z)).x - sdf(vec3(p.x, p.y - delta, p.z)).x,
    sdf(vec3(p.x, p.y, p.z  + delta)).x - sdf(vec3(p.x, p.y, p.z - delta)).x
    );
    return normalize(normal);
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)
    vec3 rayDir = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map
    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);

    float impactPoint, escapePoint;
    if (!(rayIntersectSphere(camera_position, rayDir, object_position, object_radius, impactPoint, escapePoint))) {
        gl_FragColor = screenColor;// if not intersecting with atmosphere, return original color
        return;
    }

    // scale down so that everything happens in a sphere of radius 2
    float inverseScaling = 1.0 / (0.5 * object_radius);

    vec3 origin = camera_position + impactPoint * rayDir - object_position;// the ray origin in world space
    origin *= inverseScaling;

    float steps;
    vec2 mandelDepth = rayMarch(origin, rayDir, steps);

    float realDepth = impactPoint + mandelDepth.x / inverseScaling;

    if (maximumDistance < realDepth) {
        gl_FragColor = screenColor;
        return;
    }

    vec3 intersectionPoint = origin + mandelDepth.x * rayDir;
    float intersectionDistance = length(intersectionPoint);

    vec4 mandelbulbColor = vec4(palette(mandelDepth.y), 1.0);

    float ao = steps * 0.01;
    ao = 1.0 - ao / (ao + 0.5);// reinhard
    const float contrast_offset = 0.3;
    const float contrast_mid_level = 0.5;
    ao = contrast(ao, contrast_offset, contrast_mid_level);

    mandelbulbColor.xyz *= ao * 2.0;

    vec3 normal = estimate_normal(intersectionPoint, EPSILON * 2.0);
    float ndl = 0.0;
    for (int i = 0; i < nbStars; i++) {
        vec3 starDir = normalize(star_positions[i] - object_position);
        ndl += max(0.0, dot(normal, starDir));
    }

    mandelbulbColor.xyz *= clamp(ndl, 0.3, 1.0);

    gl_FragColor = lerp(screenColor, mandelbulbColor, smoothstep(2.0, 15.0, intersectionDistance));

}
