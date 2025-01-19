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

#define MARCHINGITERATIONS 64

#define MARCHINGSTEP 1.0
#define EPSILON 0.0001

// cosine based palette, 4 vec3 params
vec3 cosineColor(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
    return a + b * cos(6.28318*(c*t+d));
}
vec3 palette (float t) {
    return cosineColor(t, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(0.07, 0.07, 0.07), accentColor);
}

// Mandelbox DE from 
// http://www.fractalforums.com/3d-fractal-generation/a-mandelbox-distance-estimate-formula/msg21412/#msg21412

#define ITERS 10
#define SCALE 3.0
#define MR2 0.35

vec4 scalevec = vec4(SCALE, SCALE, SCALE, abs(SCALE)) / MR2;
float C1 = abs(SCALE-1.0), C2 = pow(abs(SCALE), float(1-ITERS));

vec2 sdf(vec3 position){
  vec4 p = vec4(position.xyz, 1.0), p0 = vec4(position.xyz, 1.0);  // p.w is knighty's DEfactor
  for (int i=0; i<ITERS; i++) {
    p.xyz = clamp(p.xyz, -1.0, 1.0) * 2.0 - p.xyz;  // box fold: min3, max3, mad3
    float r2 = dot(p.xyz, p.xyz);  // dp3
    p.xyzw *= clamp(max(MR2/r2, MR2), 0.0, 1.0);  // sphere fold: div1, max1.sat, mul4
    p.xyzw = p*scalevec + p0;  // mad4
  }
  return vec2((length(p.xyz) - C1) / p.w - C2, p.w);
}

float closeObj = 0.0;
const float PI = 3.14159;

float rayMarch(vec3 ro, vec3 rd) {
    float t = 0.5;
    float d = 0.0;
    float w = 1.3;
    float ld = 0.0;
    float ls = 0.0;
    float s = 0.0;
    float cerr = 10000.0;
    float ct = 0.0;
    float pixradius = 1e-3;
    vec2 c;
    int inter = 0;
    for (int i = 0; i < 64; i++) {
        ld = d;
        c = sdf(ro + rd * t);
        d = c.x;
        
        //Detect intersections missed by over-relaxation
        if(w > 1.0 && abs(ld) + abs(d) < s){
            s -= w * s;
            w = 1.0;
            t += s;
            continue;
        }
        s = w * d;
        
        float err = d / t;
        
        if(abs(err) < abs(cerr)){
            ct = t;
            cerr = err;
        }
        
        //Intersect when d / t < one pixel
        if(abs(err) < pixradius){
            inter = 1;
            break;
        }
        
        t += s;
        if(t > 30.0){
            break;
        }
    }
    closeObj = c.y;
    if(inter == 0){
        ct = -1.0;
    }
    return ct;
}

float contrast(float val, float contrast_offset, float contrast_mid_level)
{
    return clamp((val - contrast_mid_level) * (1. + contrast_offset) + contrast_mid_level, 0., 1.);
}

float map(vec3 p){
    return sdf(p).x;
}

//Approximate normal
vec3 getNormal(vec3 p){
    return normalize(vec3(map(vec3(p.x + 0.0001, p.yz)) - map(vec3(p.x - 0.0001, p.yz)),
                          map(vec3(p.x, p.y + 0.0001, p.z)) - map(vec3(p.x, p.y - 0.0001, p.z)),
                	      map(vec3(p.xy, p.z + 0.0001)) - map(vec3(p.xy, p.z - 0.0001))));
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
    float inverseScaling = 3.0 * SCALE * 1.0 / (1.0 * object_radius * object_scaling_determinant);

    vec3 origin = camera_position + impactPoint * rayDir - object_position;// the ray origin in world space
    origin *= inverseScaling;

    float steps;
    float rayDepth = rayMarch(origin, rayDir);
    if(rayDepth == -1.0){
        gl_FragColor = screenColor;
        return;
    } else {
        //float realDepth = impactPoint + rayDepth / inverseScaling;

        vec3 intersectionPoint = origin + rayDepth * rayDir;

        vec3 normal = getNormal(intersectionPoint);
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float ndl = max(0.0, dot(normal, lightDir));

        vec3 diffuse = vec3(1.0, 1.0, 1.0) * ndl;
        
        gl_FragColor = vec4(diffuse, 1.0);
        return;
    }

/*
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

    float intersectionDistance = length(intersectionPoint);

    vec4 mandelbulbColor = vec4(palette(mandelDepth.y), 1.0);

    float ao = steps * 0.01;
    ao = 1.0 - ao / (ao + 0.5);// reinhard
    const float contrast_offset = 0.3;
    const float contrast_mid_level = 0.5;
    ao = contrast(ao, contrast_offset, contrast_mid_level);

    mandelbulbColor.xyz *= ao * 2.0;

    vec3 normal = normalize(vec3(
        x1.x - x2.x,
        y1.x - y2.x,
        z1.x - z2.x
    ));
    float ndl = 0.0;
    for (int i = 0; i < nbStars; i++) {
        vec3 starDir = normalize(star_positions[i] - object_position);
        ndl += max(0.0, dot(normal, starDir));
    }

    if(nbStars == 0) {
        ndl = 1.0;
    }

    mandelbulbColor.xyz *= clamp(ndl, 0.3, 1.0);

    gl_FragColor = mix(mandelbulbColor, screenColor, smoothstep(2.0, 15.0, intersectionDistance));*/

}
