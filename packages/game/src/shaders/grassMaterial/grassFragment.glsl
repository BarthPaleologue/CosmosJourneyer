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
precision lowp int;

uniform float time;

uniform vec3 cameraPosition;

varying vec3 vPosition;
varying vec3 vPositionW;

varying vec3 vNormalW;

varying float vPlanetNdl;

// This is used to render the grass blade to the depth buffer properly
// (see https://forum.babylonjs.com/t/how-to-write-shadermaterial-to-depthrenderer/47227/3 and https://playground.babylonjs.com/#6GFJNR#161)
#ifdef FORDEPTH
varying float vDepthMetric;
#endif

#include "../utils/pbr.glsl";

#include "../utils/stars.glsl";

void main() {
    #ifdef FORDEPTH
    gl_FragColor = vec4(vDepthMetric, 0.0, 0.0, 1.0);
    #else
    vec3 baseColor = vec3(0.4, 0.8, 0.08);
    vec3 tipColor = vec3(0.5, 0.5, 0.1);

    vec3 albedo = 2.0 * mix(baseColor, tipColor, pow(vPosition.y, 4.0));

    vec3 normalW = vNormalW;

    float ao = 0.7 + 0.3 * (vPosition.y * vPosition.y);

    vec3 Lo = vec3(0.0);

    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

    for(int i = 0; i < nbStars; i++) {
        vec3 starPosition = star_positions[i];
        vec3 lightDirectionW = normalize(starPosition - vPositionW);
        float ndl = dot(normalW, lightDirectionW);
        if (ndl < 0.0) {
            normalW = -normalW;
        }
        Lo += calculateLight(albedo, normalW, 0.4, 0.0, lightDirectionW, viewDirectionW, star_colors[i]);
    }

    gl_FragColor = vec4(Lo * ao, 1.0);// apply color and lighting
    #endif
} 