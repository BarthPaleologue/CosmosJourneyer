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

uniform float time;

uniform vec3 cameraPosition;

uniform sampler2D butterflyTexture;

varying vec3 vPositionW;
varying vec2 vUV;

varying vec3 vNormalW;

// This is used to render the grass blade to the depth buffer properly
// (see https://forum.babylonjs.com/t/how-to-write-shadermaterial-to-depthrenderer/47227/3 and https://playground.babylonjs.com/#6GFJNR#161)
#ifdef FORDEPTH
varying float vDepthMetric;
#endif

varying vec3 vOriginalWorldPosition;

// src: https://gist.github.com/mairod/a75e7b44f68110e1576d77419d608786
vec3 hueShift( vec3 color, float hueAdjust ){
    const vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);
    const vec3  kRGBToI      = vec3 (0.596, -0.275, -0.321);
    const vec3  kRGBToQ      = vec3 (0.212, -0.523, 0.311);

    const vec3  kYIQToR     = vec3 (1.0, 0.956, 0.621);
    const vec3  kYIQToG     = vec3 (1.0, -0.272, -0.647);
    const vec3  kYIQToB     = vec3 (1.0, -1.107, 1.704);

    float   YPrime  = dot (color, kRGBToYPrime);
    float   I       = dot (color, kRGBToI);
    float   Q       = dot (color, kRGBToQ);
    float   hue     = atan (Q, I);
    float   chroma  = sqrt (I * I + Q * Q);

    hue += hueAdjust;

    Q = chroma * sin (hue);
    I = chroma * cos (hue);

    vec3    yIQ   = vec3 (YPrime, I, Q);

    return vec3( dot (yIQ, kYIQToR), dot (yIQ, kYIQToG), dot (yIQ, kYIQToB) );
}

#include "../utils/pbr.glsl";

#include "../utils/stars.glsl";

void main() {
    vec4 butterflyColor = texture(butterflyTexture, vUV);
    if(butterflyColor.a < 0.1) discard;

    butterflyColor.rgb = hueShift(butterflyColor.rgb, vOriginalWorldPosition.x * 10.0 + vOriginalWorldPosition.z * 10.0);

    vec3 normalW = vNormalW;

    vec3 Lo = vec3(0.0);
    
    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

    for(int i = 0; i < nbStars; i++) {
        vec3 starPosition = star_positions[i];
        vec3 lightDirectionW = normalize(starPosition - vPositionW);
        float ndl = dot(normalW, lightDirectionW);
        if (ndl < 0.0) {
            normalW = -normalW;
        }
        Lo += calculateLight(butterflyColor.rgb, normalW, 1.0, 0.0, lightDirectionW, viewDirectionW, star_colors[i]);
    }

    Lo += butterflyColor.rgb * 0.2;

    #ifdef FORDEPTH
    gl_FragColor = vec4(vDepthMetric, 0.0, 0.0, 1.0);
    #else
    gl_FragColor = vec4(Lo, 1.0);
    #endif
} 