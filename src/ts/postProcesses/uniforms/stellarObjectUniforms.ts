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

import { Effect } from "@babylonjs/core/Materials/effect";
import { Transformable } from "../../architecture/transformable";
import { Star } from "../../stellarObjects/star/star";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { flattenColor3Array, flattenVector3Array } from "../../utils/algebra";
import { getRgbFromTemperature } from "../../utils/specrend";

export const StellarObjectUniformNames = {
    STAR_POSITIONS: "star_positions",
    STAR_COLORS: "star_colors",
    NB_STARS: "nbStars"
};

//FIXME: take point lights as input instead of transformables
export function setStellarObjectUniforms(effect: Effect, stellarObjects: Transformable[]): void {
    effect.setInt(StellarObjectUniformNames.NB_STARS, stellarObjects.length);

    if (stellarObjects.length === 0) {
        effect.setArray3(StellarObjectUniformNames.STAR_POSITIONS, [0, 0, 0]);
        effect.setArray3(StellarObjectUniformNames.STAR_COLORS, [1, 1, 1]);
        return;
    }

    effect.setArray3(
        StellarObjectUniformNames.STAR_POSITIONS,
        flattenVector3Array(stellarObjects.map((stellarObject) => stellarObject.getTransform().getAbsolutePosition()))
    );
    effect.setArray3(
        StellarObjectUniformNames.STAR_COLORS,
        flattenColor3Array(
            stellarObjects.map((stellarObject) =>
                stellarObject instanceof Star
                    ? getRgbFromTemperature(stellarObject.model.physics.blackBodyTemperature)
                    : Color3.White()
            )
        )
    );
}
