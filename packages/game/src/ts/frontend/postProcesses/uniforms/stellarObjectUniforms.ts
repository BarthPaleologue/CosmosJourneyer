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

import { type PointLight } from "@babylonjs/core/Lights/pointLight";
import { type Effect } from "@babylonjs/core/Materials/effect";

import { flattenColor3Array, flattenVector3Array } from "@/frontend/helpers/algebra";

export const StellarObjectUniformNames = {
    STAR_POSITIONS: "star_positions",
    STAR_COLORS: "star_colors",
    NB_STARS: "nbStars",
};

export function setStellarObjectUniforms(effect: Effect, stellarObjects: ReadonlyArray<PointLight>): void {
    effect.setInt(StellarObjectUniformNames.NB_STARS, stellarObjects.length);

    if (stellarObjects.length === 0) {
        effect.setArray3(StellarObjectUniformNames.STAR_POSITIONS, [0, 0, 0]);
        effect.setArray3(StellarObjectUniformNames.STAR_COLORS, [1, 1, 1]);
        return;
    }

    effect.setArray3(
        StellarObjectUniformNames.STAR_POSITIONS,
        flattenVector3Array(stellarObjects.map((stellarObject) => stellarObject.getAbsolutePosition())),
    );
    effect.setArray3(
        StellarObjectUniformNames.STAR_COLORS,
        flattenColor3Array(stellarObjects.map((stellarObject) => stellarObject.diffuse)),
    );
}
