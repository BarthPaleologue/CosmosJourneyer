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

#include "../utils/stars.glsl";

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec3 vUnitSamplePoint;

varying vec3 vPosition;// position of the vertex varyingsphere space

uniform vec3 cameraPosition;// camera position in world space

uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform float colorSharpness;

uniform float time;

uniform float seed;

#include "../utils/pi.glsl";

#include "../utils/simplex4.glsl";

#include "../utils/saturate.glsl";

#include "../utils/smoothSharpener.glsl";

#include "../utils/pbr.glsl";

void main() {
    vec3 normalW = vNormalW;

    float ndl = 0.0;
    for (int i = 0; i < nbStars; i++) {
        vec3 starLightRayW = normalize(star_positions[i] - vPositionW);// light ray direction in world space
        ndl = max(ndl, max(0.0, dot(normalW, starLightRayW)));
    }

    vec4 seededSamplePoint = vec4(vUnitSamplePoint * 2.0, mod(seed, 1e3));

    seededSamplePoint.y *= 2.5;

    float latitude = seededSamplePoint.y;

    float seedImpact = mod(seed, 1e3);

    float warpingStrength = 2.0;
    float warping = fractalSimplex4(seededSamplePoint + vec4(seedImpact, 0.0, 0.0, time * 0.01), 5, 2.0, 2.0) * warpingStrength;

    float colorDecision1 = fractalSimplex4(vec4(latitude + warping, seedImpact, -seedImpact, seedImpact), 3, 2.0, 2.0);

    float colorDecision2 = fractalSimplex4(vec4(latitude - warping, seedImpact, -seedImpact, seedImpact), 3, 2.0, 2.0);

    vec3 albedo = mix(color2, color1, smoothstep(0.4, 0.6, colorDecision1));

    albedo = 3.0 * mix(color3, albedo, smoothSharpener(colorDecision2, colorSharpness));

    float roughness = 0.4;
    float metallic = 0.0;

    // pbr accumulation
    vec3 Lo = vec3(0.0);
    vec3 viewRayW = normalize(cameraPosition - vPositionW);
    for (int i = 0; i < nbStars; i++) {
        vec3 L = normalize(star_positions[i] - vPositionW);

        Lo += calculateLight(albedo, normalW, roughness, metallic, L, viewRayW, star_colors[i]);
    }

    gl_FragColor = vec4(Lo, 1.0);
}
