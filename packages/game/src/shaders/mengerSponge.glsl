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

float sdBox( vec3 p, vec3 b ) {
  vec3  di = abs(p) - b;
  float mc = max(di.x,max(di.y,di.z));
  return min(mc,length(max(di,0.0)));
}

float boxIntersect( in vec3 ro, in vec3 rd, in vec3 rad ) {
    vec3 m = 1.0/rd;
    vec3 n = m*ro;
    vec3 k = abs(m)*rad;
	
    vec3 t1 = -n - k;
    vec3 t2 = -n + k;

	float tN = max( max( t1.x, t1.y ), t1.z );
	float tF = min( min( t2.x, t2.y ), t2.z );
	
	if( tN > tF || tF < 0.0) return 1e30;
	return tN;
}

//https://www.shadertoy.com/view/XttfRN
float distanceEstimator( in vec3 p ) {
    float d = sdBox(p,vec3(1.0));
    float s = .5;
    for( int m=0; m<7; m++ ) {
        vec3 a = fract( p*s )-.5;
        s *= 3.;
        vec3 r = abs(1.-6.*abs(a));
        float da = max(r.x,r.y);
        float db = max(r.y,r.z);
        float dc = max(r.z,r.x);
        float c = (min(da,min(db,dc))-1.0)/(2.*s);

        if( c>d ) {
          d = c;
        }
    }
    return d;
}

#include "./utils/rayMarching.glsl";

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

    float rayDepth = rayMarch(origin, rayDir, max(impactPoint, 0.0) * inverseScaling);
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
