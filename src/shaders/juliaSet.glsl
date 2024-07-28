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
#define EPSILON 0.001

#define SDF_STEPS 15

// cosine based palette, 4 vec3 params
vec3 cosineColor(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
    return a + b * cos(6.28318*(c*t+d));
}
vec3 palette (float t) {
    return cosineColor(t, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(0.07, 0.07, 0.07), accentColor);
}

vec2 sdf(vec3 pos)
{
    float t = elapsedSeconds / 3.0;
    
	vec4 c = 0.5*vec4(cos(t),cos(t*1.1),cos(t*2.3),cos(t*3.1));
    vec4 z = vec4(pos, 0.0 );
	vec4 nz;
    
	float md2 = 1.0;
	float mz2 = dot(z,z);

	for(int i=0;i<SDF_STEPS;i++)
	{
		md2*=4.0*mz2;
	    nz.x=z.x*z.x-dot(z.yzw,z.yzw);
		nz.yzw=2.0*z.x*z.yzw;
		z=nz+c;

		mz2 = dot(z,z);
		if(mz2>4.0)
        {
			break;
        }
	}

    float colorIndex = 50.0 * pow(md2, 0.128 / float(MARCHINGITERATIONS));

    float distance = 0.25*sqrt(mz2/md2)*log(mz2);

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

        if(depth > 15.0) {
            break;
        }
    }

    return vec2(depth, c);
}

float contrast(float val, float contrast_offset, float contrast_mid_level)
{
    return clamp((val - contrast_mid_level) * (1. + contrast_offset) + contrast_mid_level, 0., 1.);
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjectionView);// the pixel position in world space (near plane)
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

    vec3 origin = camera_position + impactPoint * rayDir - object_position;// the ray origin in world space
    origin *= inverseScaling;

    float steps;
    vec2 juliaDepthAndIndex = rayMarch(origin, rayDir, steps);

    float realDepth = impactPoint + juliaDepthAndIndex.x / inverseScaling;

    if (maximumDistance < realDepth) {
        gl_FragColor = screenColor;
        return;
    }

    vec3 intersectionPoint = origin + juliaDepthAndIndex.x * rayDir;

    // compute normal and anti-aliasing at the same time
    vec3 p = intersectionPoint;
    float delta = EPSILON * 2.0;
    vec2 x1 = sdf(vec3(p.x + delta, p.y, p.z));
    vec2 x2 = sdf(vec3(p.x - delta, p.y, p.z));
    vec2 y1 = sdf(vec3(p.x, p.y + delta, p.z));
    vec2 y2 = sdf(vec3(p.x, p.y - delta, p.z));
    vec2 z1 = sdf(vec3(p.x, p.y, p.z + delta));
    vec2 z2 = sdf(vec3(p.x, p.y, p.z - delta));

    juliaDepthAndIndex += x1 + x2 + y1 + y2 + z1 + z2;
    juliaDepthAndIndex /= 7.0;

    intersectionPoint = origin + juliaDepthAndIndex.x * rayDir;

    float intersectionDistance = length(intersectionPoint);

    vec4 juliaColor = vec4(palette(juliaDepthAndIndex.y), 1.0);

    float ao = steps * 0.01;
    ao = 1.0 - ao / (ao + 0.5);// reinhard
    const float contrast_offset = 0.3;
    const float contrast_mid_level = 0.5;
    ao = contrast(ao, contrast_offset, contrast_mid_level);

    juliaColor.xyz *= ao * 2.0;

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

    juliaColor.xyz *= clamp(ndl, 0.3, 1.0);

    gl_FragColor = mix(juliaColor, screenColor, smoothstep(2.0, 15.0, intersectionDistance));

}
