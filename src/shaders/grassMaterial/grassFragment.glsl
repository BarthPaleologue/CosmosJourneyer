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

uniform float time;

uniform vec3 cameraPosition;

varying vec3 vPosition;
varying vec3 vPositionW;

varying mat4 normalMatrix;
varying vec3 vNormal;

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
    vec3 baseColor = 3.0 * vec3(0.05, 0.2, 0.01);
    vec3 tipColor = vec3(0.5, 0.5, 0.1);

    vec3 albedo = mix(baseColor, tipColor, pow(vPosition.y, 4.0));

    vec3 normalW = normalize(vec3(normalMatrix * vec4(vNormal, 0.0)));

    float density = 0.2;
    float aoForDensity = mix(1.0, 0.25, density);
    float ao = mix(aoForDensity, 1.0, pow(vPosition.y, 2.0));

    vec3 Lo = vec3(0.0);

    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

    for(int i = 0; i < nbStars; i++) {
        vec3 starPosition = star_positions[i];
        vec3 lightDirectionW = normalize(starPosition - vPositionW);
        float ndl = dot(normalW, lightDirectionW);
        if (ndl < 0.0) {
            normalW = -normalW;
        }
        Lo += calculateLight(albedo, normalW, 0.3, 0.0, lightDirectionW, viewDirectionW, star_colors[i]);
    }

    Lo += albedo * 0.2;

    gl_FragColor = vec4(Lo * ao, 1.0);// apply color and lighting
    #endif
} 