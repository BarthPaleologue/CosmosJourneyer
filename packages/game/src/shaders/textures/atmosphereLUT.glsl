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

#define PI 3.1415926535897932
#define POINTS_FROM_CAMERA 120// number sample points along camera ray
#define OPTICAL_DEPTH_POINTS 120// number sample points along light ray

varying vec2 vUV;

#include "../utils/rotateAround.glsl";

#include "../utils/rayIntersectSphere.glsl";


const float EARTH_RADIUS = 1000e3;
const float ATMOSPHERE_RADIUS = 100e3;
const vec3 SUN_DIR = vec3(0.0, -1.0, 0.0);

struct Object {
    float radius;
    vec3 position;
};
const Object object = Object(EARTH_RADIUS, vec3(0.0));

struct Atmosphere {
    float radius;// atmosphere radius (calculate from planet center)
    float falloff;// controls exponential opacity falloff
    float sunIntensity;// controls atmosphere overall brightness
    float rayleighStrength;// controls color dispersion
    float mieStrength;// controls mie scattering
    float densityModifier;// density of the atmosphere
    float redWaveLength;// the wave length for the red part of the scattering
    float greenWaveLength;// same with green
    float blueWaveLength;// same with blue
    float mieHaloRadius;// mie halo radius
};
const Atmosphere atmosphere = Atmosphere(EARTH_RADIUS + ATMOSPHERE_RADIUS, 1.0, 10.0, 1.0, 1.0, 1.0, 700.0, 530.0, 440.0, 0.6);

// based on https://www.youtube.com/watch?v=DxfEbulyFcY by Sebastian Lague
vec2 densityAtPoint(vec3 samplePoint) {
    float heightAboveSurface = length(samplePoint - object.position) - object.radius;
    float height01 = heightAboveSurface / (atmosphere.radius - object.radius);// normalized height between 0 and 1

    vec2 localDensity = vec2(
    atmosphere.densityModifier * exp(-height01 * atmosphere.falloff),
    atmosphere.densityModifier * exp(-height01 * atmosphere.falloff * 0.5)
    );

    localDensity *= (1.0 - height01);

    return localDensity;// density with exponential falloff
}


vec2 opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength) {

    vec3 densitySamplePoint = rayOrigin;// that's where we start

    float stepSize = rayLength / float(OPTICAL_DEPTH_POINTS - 1);// ray length between sample points

    vec2 accumulatedOpticalDepth = vec2(0.0);

    for (int i = 0; i < OPTICAL_DEPTH_POINTS; i++) {
        accumulatedOpticalDepth += densityAtPoint(densitySamplePoint) * stepSize;// linear approximation : density is constant between sample points
        densitySamplePoint += rayDir * stepSize;// we move the sample point
    }

    return accumulatedOpticalDepth;
}

void main() {
    float height01 = vUV.y;
    float lutx = vUV.x;
    float costheta = lutx * 2.0 - 1.0;
    float theta = acos(costheta);

    vec3 surfacePoint = rotateAround(vec3(0.0, EARTH_RADIUS, 0.0), vec3(0.0, 0.0, 1.0), theta);
    vec3 surfaceNormal = normalize(surfacePoint);
    vec3 atmospherePoint = surfacePoint + surfaceNormal * ATMOSPHERE_RADIUS * height01;

    float t0, t1;
    rayIntersectSphere(atmospherePoint, SUN_DIR, vec3(0.0), EARTH_RADIUS + ATMOSPHERE_RADIUS, t0, t1);

    vec2 sunRayOpticalDepth = opticalDepth(atmospherePoint, SUN_DIR, t1);

    vec3 color = vec3(sunRayOpticalDepth.x, sunRayOpticalDepth.y, 0.0);
    color = 1.0 / (1.0 + 1e-5 * color);

    gl_FragColor = vec4(color, 1.0);
}