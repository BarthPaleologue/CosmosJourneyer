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

#include "../utils/noise1D.glsl";

#include "../utils/remap.glsl";

/**
 * Returns the albedo of the rings in r,g,b and the density in a.
 * The density is a value between 0 and 1.
 */
vec4 ringPatternAtPoint(vec3 samplePoint) {
    vec3 samplePointPlanetSpace = samplePoint - object_position;

    float distanceToPlanet = length(samplePointPlanetSpace);
    
    // out if not intersecting with rings and interpolation area
    if (distanceToPlanet < rings_inner_radius || distanceToPlanet > rings_outer_radius) return vec4(0.0);

    float uvX = remap(distanceToPlanet, rings_inner_radius, rings_outer_radius, 0.0, 1.0);
    vec2 uv = vec2(uvX, 0.0);
    
    vec4 result = texture2D(rings_pattern_lut, uv);

    // fade at the edge of the texture to avoid sampling artifacts
    result.a *= smoothstep(0.02, 0.03, uvX);
    result.a *= (1.0 - smoothstep(0.97, 0.98, uvX));

    return result;
}