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

#include "../utils/noise1D.glsl";

#include "../utils/remap.glsl";

float ringDensityAtPoint(vec3 samplePoint) {
    vec3 samplePointPlanetSpace = samplePoint - object_position;

    float distanceToPlanet = length(samplePointPlanetSpace);
    float relativeDistance = distanceToPlanet / object_radius;

    // out if not intersecting with rings and interpolation area
    if (relativeDistance < rings_start || relativeDistance > rings_end) return 0.0;

    float uvX = remap(relativeDistance, rings_start, rings_end, 0.0, 1.0);
    vec2 uv = vec2(uvX, 0.0);
    
    // trick from https://www.shadertoy.com/view/3dVSzm to avoid Greenwich artifacts
    vec2 df = fwidth(uv);
    if(df.x > 0.5) df.x = 0.0;
    float lutDensity = textureLod(rings_lut, uv, log2(max(df.x, df.y) * 1024.0)).r;

    return lutDensity;
}