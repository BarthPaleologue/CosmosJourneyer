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

import type { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { type Effect } from "@babylonjs/core/Materials/effect";

export const StellarObjectUniformNames = {
    STAR_DIRECTIONS: "star_directions",
    STAR_COLORS: "star_colors",
    NB_STARS: "nbStars",
};

let starDirections = new Float32Array(0);
let starColors = new Float32Array(0);

export function setStellarObjectUniforms(effect: Effect, stellarObjects: ReadonlyArray<DirectionalLight>): void {
    effect.setInt(StellarObjectUniformNames.NB_STARS, stellarObjects.length);

    if (stellarObjects.length === 0) {
        return;
    }

    if (stellarObjects.length * 3 > starDirections.length) {
        starDirections = new Float32Array(stellarObjects.length * 3);
        starColors = new Float32Array(stellarObjects.length * 3);
    }

    for (const [index, stellarObject] of stellarObjects.entries()) {
        starDirections[index * 3] = -stellarObject.direction.x;
        starDirections[index * 3 + 1] = -stellarObject.direction.y;
        starDirections[index * 3 + 2] = -stellarObject.direction.z;
        starColors[index * 3] = stellarObject.diffuse.r;
        starColors[index * 3 + 1] = stellarObject.diffuse.g;
        starColors[index * 3 + 2] = stellarObject.diffuse.b;
    }

    effect.setFloatArray3(StellarObjectUniformNames.STAR_DIRECTIONS, starDirections);
    effect.setFloatArray3(StellarObjectUniformNames.STAR_COLORS, starColors);
}
