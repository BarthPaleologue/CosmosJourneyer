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

uniform vec3 accentColor;
uniform float elapsedSeconds;
uniform float averageScreenSize;

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

float distanceEstimator(vec3 z) {
    const vec3 va = vec3(  0.0,  0.57735,  0.0 );
    const vec3 vb = vec3(  0.0, -1.0,  1.15470 );
    const vec3 vc = vec3(  1.0, -1.0, -0.57735 );
    const vec3 vd = vec3( -1.0, -1.0, -0.57735 );
    
    vec3 p = z;
	float a = 0.0;
    float s = 1.0;
    float r = 1.0;
    float dm;
    for( int i=0; i<9; i++ )
	{
        vec3 v;
	    float d, t;
		d = dot(p-va,p-va);            { v=va; dm=d; t=0.0; }
        d = dot(p-vb,p-vb); if( d<dm ) { v=vb; dm=d; t=1.0; }
        d = dot(p-vc,p-vc); if( d<dm ) { v=vc; dm=d; t=2.0; }
        d = dot(p-vd,p-vd); if( d<dm ) { v=vd; dm=d; t=3.0; }
		p = v + 2.0*(p - v); r*= 2.0;
		a = t + 4.0*a; s*= 4.0;
	}

    float distance  = (sqrt(dm)-1.0)/r;
    float address   = a/s;

	return distance;
}

float rayMarch(vec3 rayOrigin, vec3 rayDepth) {
    float currentDepth = 0.01;
    float newDistance = 0.0;
    float stepSizeFactor = 1.3;
    float oldDistance = 0.0;
    float ls = 0.0;
    float stepSize = 0.0;
    float cerr = 10000.0;
    float ct = 0.0;
    float pixradius = 1.0 / averageScreenSize;
    int inter = 0;
    for (int i = 0; i < 64; i++) {
        oldDistance = newDistance;
        newDistance = distanceEstimator(rayOrigin + rayDepth * currentDepth);
        
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
    return ct;
}

float map(vec3 p){
    return distanceEstimator(p);
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

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)
    vec3 rayDir = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map
    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);

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
    float rayDepth = rayMarch(origin, rayDir);
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

    vec3 albedo = accentColor;
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

    color = smoothstep(0.0, 0.8, color * 2.0) * 2.0;

    gl_FragColor = vec4(color, 1.0);
}
