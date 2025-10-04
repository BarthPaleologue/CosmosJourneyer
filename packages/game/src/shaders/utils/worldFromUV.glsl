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

// compute the world position of a pixel from its uv coordinates
// This is an evolution from the code found here
// https://forum.babylonjs.com/t/pixel-position-in-world-space-from-fragment-postprocess-shader-issue/30232
// also see https://www.babylonjs-playground.com/#1PHYB0#318 for smaller scale testing
// This is a revised version that works with the reverse depth buffer
vec3 worldFromUV(vec2 pos, mat4 inverseProjection, mat4 inverseView) {
    vec4 ndc = vec4(pos.xy * 2.0 - 1.0, 1.0, 1.0); // get ndc position (z = 1 because the depth buffer is reversed)
    vec4 posVS = inverseProjection * ndc; // unproject the ndc coordinates : we are now in view space if i understand correctly
    vec4 posWS = inverseView * posVS; // then we use inverse view to get to world space, division by w to get actual coordinates
    return  posWS.xyz / posWS.w;
}
