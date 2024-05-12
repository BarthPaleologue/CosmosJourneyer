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

#define MAX_STARS 5
uniform int nbStars;// number of stars
uniform vec3 star_positions[MAX_STARS];
uniform vec3 star_colors[MAX_STARS];

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec3 vUnitSamplePoint;

varying vec3 vPosition;// position of the vertex varyingsphere space

varying vec3 cameraPosition;// camera position in world space

uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform float colorSharpness;

uniform float time;

uniform float seed;

#include "../utils/simplex4.glsl";

#include "../utils/saturate.glsl";

#include "../utils/smoothSharpener.glsl";

void main() {
    vec3 viewRayW = normalize(cameraPosition - vPositionW);// view direction in world space

    vec3 normalW = vNormalW;

    vec3 ndl = vec3(0.0);
    float specComp = 0.0;
    for (int i = 0; i < nbStars; i++) {
        vec3 starLightRayW = normalize(star_positions[i] - vPositionW);// light ray direction in world space
        ndl += max(0.0, dot(normalW, starLightRayW)) * star_colors[i];// diffuse lighting

        vec3 angleW = normalize(viewRayW + starLightRayW);
        specComp += max(0.0, dot(normalW, angleW));
    }
    ndl = clamp(ndl, 0.0, 1.0);
    specComp = saturate(specComp);
    specComp = pow(specComp, 128.0);

    vec3 color = vec3(0.0);

    if (ndl.x > 0.0 || ndl.y > 0.0 || ndl.z > 0.0) {
        vec4 seededSamplePoint = vec4(vUnitSamplePoint * 2.0, mod(seed, 1e3));

        seededSamplePoint.y *= 2.5;

        float latitude = seededSamplePoint.y;

        float seedImpact = mod(seed, 1e3);

        float warpingStrength = 2.0;
        float warping = fractalSimplex4(seededSamplePoint + vec4(seedImpact, 0.0, 0.0, time * 0.0001), 5, 2.0, 2.0) * warpingStrength;

        float colorDecision1 = fractalSimplex4(vec4(latitude + warping, seedImpact, -seedImpact, seedImpact), 3, 2.0, 2.0);

        float colorDecision2 = fractalSimplex4(vec4(latitude - warping, seedImpact, -seedImpact, seedImpact), 3, 2.0, 2.0);

        color = mix(color2, color1, smoothstep(0.4, 0.6, colorDecision1));

        color = mix(color3, color, smoothSharpener(colorDecision2, colorSharpness));
    }

    specComp /= 2.0;

    vec3 finalColor = color.rgb * (ndl + specComp * ndl);

    gl_FragColor = vec4(finalColor, 1.0);
}
