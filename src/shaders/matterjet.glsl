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

uniform mat4 inverseWorld;

#include "./utils/camera.glsl";

#include "./utils/object.glsl";

#include "./utils/rotateAround.glsl";

#include "./utils/remap.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/removeAxialTilt.glsl";

bool rayIntersectInfiniteCone2(vec3 rayOrigin, vec3 rayDir, float theta, out float t1, out float t2) {
    float cosTheta = cos(theta);
    float cosTheta2 = cosTheta * cosTheta;

    float a = rayDir.y * rayDir.y - cosTheta2;
    float b = 2.0 * (rayDir.y * rayOrigin.y - dot(rayDir, rayOrigin) * cosTheta2);
    float c = rayOrigin.y * rayOrigin.y - dot(rayOrigin, rayOrigin) * cosTheta2;

    float det = b*b - 4.0*a*c;
    if (det < 0.0) return false;

    float sqrtDet = sqrt(det);

    float intersect1 = (-b - sqrtDet) / (2.0 * a);
    float intersect2 = (-b + sqrtDet) / (2.0 * a);

    t1 = min(intersect1, intersect2);
    t2 = max(intersect1, intersect2);

    return true;
}

float dot2( in vec3 v ) { return dot(v,v); }

bool iCappedCone( in vec3  ro, in vec3  rd, in float theta, out float t1, out float t2) {
    vec3 pa = vec3(0.0);
    vec3 pb = pa + vec3(0.0, 1000000e3, 0.0);

    float ra = 1.0;
    float rb = 0.3 * 100000e3;

    vec3  ba = pb - pa;
    vec3  oa = ro - pa;
    vec3  ob = ro - pb;

    float m0 = dot(ba,ba);
    float m1 = dot(oa,ba);
    float m2 = dot(ob,ba);
    float m3 = dot(rd,ba);

    //caps
    if(m1 < 0.0 || m2 > 0.0) return false;
    //if( m1<0.0 ) { if( dot2(oa*m3-rd*m1)<(ra*ra*m3*m3) ) return vec4(-m1/m3,-ba*inversesqrt(m0)); }
    //else if( m2>0.0 ) { if( dot2(ob*m3-rd*m2)<(rb*rb*m3*m3) ) return vec4(-m2/m3, ba*inversesqrt(m0)); }

    // body
    float m4 = dot(rd,oa);
    float m5 = dot(oa,oa);
    float rr = ra - rb;
    float hy = m0 + rr*rr;

    float k2 = m0*m0    - m3*m3*hy;
    float k1 = m0*m0*m4 - m1*m3*hy + m0*ra*(rr*m3*1.0        );
    float k0 = m0*m0*m5 - m1*m1*hy + m0*ra*(rr*m1*2.0 - m0*ra);

    float h = k1*k1 - k2*k0;
    if( h<0.0 ) return false; //return vec4(-1.0);

    //float t = (-k1+sqrt(h))/k2;
    float intersect1 = (-k1+sqrt(h))/k2;
    float intersect2 = (-k1-sqrt(h))/k2;

    t1 = min(intersect1, intersect2);
    t2 = max(intersect1, intersect2);

    float y = m1 + t*m3;
    if( y>0.0 && y<m0 )
    {
        return true; //return vec4(t, normalize(m0*(m0*(oa+t*rd)+rr*ba*ra)-ba*hy*y));
    }

    return false; //return vec4(-1.0);
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

float spiralDensity(vec3 pointOnCone, float coneMaxHeight) {
    vec2 pointOnXZPlane = vec2(pointOnCone.x, pointOnCone.z);
    float theta = atan(pointOnXZPlane.y, pointOnXZPlane.x) + 3.14 * min(0.0, sign(pointOnCone.y));
    float heightFraction = abs(pointOnCone.y) / coneMaxHeight;

    float density = 1.0;

    // smoothstep fadeout when the height is too much (outside of cone)
    density *= smoothstep(0.9, 0.0, heightFraction);

    float d = spiralSDF(theta + time, 0.2 + sqrt(heightFraction) / 2.0) / (0.3 + heightFraction * 2.0);
    //d = pow(d, 4.0);

    density *= smoothstep(0.6, 1.0, pow(1.0 - d, 8.0)) * 2.0;//smoothstep(0.85, 1.0, 1.0 - d) * 2.0;

    //density *= d * 500.0;

    return density;
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);

    vec3 rayDir = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

    vec4 finalColor = screenColor;

    vec3 camera_position_local = vec3(inverseWorld * vec4(camera_position, 1.0));
    vec3 rayDir_local = vec3(inverseWorld * vec4(rayDir, 0.0));

    const float jetHeight = 10000000e3;
    const vec3 jetColor = vec3(0.5, 0.5, 1.0);

    float t1, t2;
    if (iCappedCone(camera_position_local, rayDir_local, 0.5, t1, t2)) {
        if (t2 > 0.0 && t1 < maximumDistance) {
            float startT = max(t1, 0.0);
            float endT = min(t2, maximumDistance);
            vec3 startPoint = camera_position_local + startT * rayDir_local;
            vec3 endPoint = camera_position_local + t2 * rayDir_local;
            float startDistanceToAxis = length(startPoint.xz);
            float endDistanceToAxis = length(endPoint.xz);
            float averageDistanceToAxis = (startDistanceToAxis + endDistanceToAxis) / 2.0;
            float distance = endT - startT;
            int nbSamples = 32;
            float step = distance / float(nbSamples);
            vec4 sum = vec4(0., 0., 0., 1.);
            for (int i = 0; i < nbSamples; i++) {
                float t = startT + float(i) * step;
                vec3 jetPointPosition = camera_position_local + t * rayDir_local;
                float distanceToAxis = length(jetPointPosition.xz);
                float density = spiralDensity(jetPointPosition, jetHeight);
                density *= smoothstep(0.1, 1.0, 1.0 - distanceToAxis / averageDistanceToAxis);
                density *= smoothstep(0.2, 1.0, distanceToAxis / averageDistanceToAxis);

                density = clamp((density / float(nbSamples)) * 20.0, 0.0, 1.0);

                sum.rgb += vec3(density) * vec3(1.1, 0.9, .5) * sum.a;
                sum.a *= 1.-density;

                sum.rgb += exp(-density * .2) * density * vec3(0.15, 0.45, 1.1) * sum.a;
            }
            finalColor.rgb = mix(sum.rgb, screenColor.rgb, sum.a);
            if (startT == 0.0) finalColor.rgb = vec3(1.0, 0.0, 0.0);
            //if (endT == 0.0) finalColor.rgb = vec3(0.0, 1.0, 0.0);
        }
        finalColor.rgb = vec3(0.0, 1.0, 0.0);
    } else {
        finalColor.rgb = vec3(0.0, 0.0, 1.0);
    }

    gl_FragColor = finalColor;// displaying the final color
}