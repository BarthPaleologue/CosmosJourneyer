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

precision lowp float;

varying vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

uniform float time;

#include "./utils/camera.glsl";

#include "./utils/object.glsl";

#include "./utils/rotateAround.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/removeAxialTilt.glsl";

// from https://www.shadertoy.com/view/MtcXWr
bool rayIntersectCone(vec3 rayOrigin, vec3 rayDir, vec3 tipPosition, vec3 orientation, float coneAngle, out float t1, out float t2) {
    vec3 co = rayOrigin - tipPosition;

    float a = dot(rayDir, orientation)*dot(rayDir, orientation) - coneAngle*coneAngle;
    float b = 2. * (dot(rayDir, orientation)*dot(co, orientation) - dot(rayDir, co)*coneAngle*coneAngle);
    float c = dot(co, orientation)*dot(co, orientation) - dot(co, co)*coneAngle*coneAngle;

    float det = b*b - 4.*a*c;
    if (det < 0.) return false;

    det = sqrt(det);
    t1 = (-b - det) / (2. * a);
    t2 = (-b + det) / (2. * a);

    // This is a bit messy; there ought to be a more elegant solution.
    float t = t1;
    if (t < 0. || t2 > 0. && t2 < t) t = t2;
    if (t < 0.) return false;

    vec3 cp = rayOrigin + t*rayDir - tipPosition;
    float h = dot(cp, orientation);

    vec3 n = normalize(cp * dot(orientation, cp) / dot(cp, cp) - orientation);

    return true;
}

// see https://www.shadertoy.com/view/tslcW4
const float a=1.0;
const float b=.1759;
const float PI=3.14159265359;

float spiralSDF(float theta, float radius) {

    float t=theta;
    // t=(t+PI)/(2.*PI);
    float r=radius;

    float n=(log(r/a)/b-t)/(2.*PI);

    // Cap the spiral
    // float nm = (log(0.11)/b-t)/(2.0*PI);
    // n = min(n,nm);
    // return (n+1.0)/100.0;
    float upper_r=a*exp(b*(t+2.*PI*ceil(n)));
    float lower_r=a*exp(b*(t+2.*PI*floor(n)));
    // float lower_r = 0.0;

    return min(abs(upper_r-r), abs(r-lower_r));
}

float spiralDensity(vec3 pointOnCone, vec3 coneAxis, float coneMaxHeight) {
    // Then we rotate that point so that we eliminate the axial tilt of the star from the equation
    vec3 pointOnYCone = removeAxialTilt(pointOnCone, coneAxis);

    vec2 pointOnXZPlane = vec2(pointOnYCone.x, pointOnYCone.z);
    float theta = atan(pointOnXZPlane.y, pointOnXZPlane.x) + 3.14 * min(0.0, sign(dot(pointOnCone, coneAxis)));
    float heightFraction = abs(pointOnYCone.y) / coneMaxHeight;

    float density = 1.0;

    // smoothstep fadeout when the height is too much (outside of cone)
    density *= smoothstep(1.0, 0.0, heightFraction);

    float d = spiralSDF(theta + time, 0.2 + sqrt(heightFraction) / 2.0) / (0.3 + heightFraction * 2.0);
    //d = pow(d, 4.0);

    density *= smoothstep(0.6, 1.0, pow(1.0 - d, 8.0)) * 2.0; //smoothstep(0.85, 1.0, 1.0 - d) * 2.0;

    //density *= d * 500.0;

    return density;
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, depth, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position);

    vec3 rayDir = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

    vec4 finalColor = screenColor;

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

    gl_FragColor = finalColor;// displaying the final color
}