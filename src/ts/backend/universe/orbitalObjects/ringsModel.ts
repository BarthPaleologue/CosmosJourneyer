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

import { Color3 } from "@babylonjs/core/Maths/math.color";
import { normalRandom, randRange } from "extended-random";

import { RGBColor } from "@/utils/colors";
import { clamp } from "@/utils/math";

/**
 * Represents the rings of a celestial body
 */
export type RingsModel = {
    /**
     * The closest distance between the rings and the center of the celestial body in meters
     */
    innerRadius: number;

    /**
     * The farthest distance between the rings and the center of the celestial body in meters
     */
    outerRadius: number;

    /**
     * The frequency of the stripes pattern
     */
    frequency: number;

    /**
     * Opacity of the planetary rings
     */
    opacity: number;

    /**
     * The main color of the rings in RGB color space
     */
    color: RGBColor;

    /**
     * The seed used for random
     */
    seed: number;
};

export function newSeededRingsModel(celestialBodyRadius: number, rng: (step: number) => number): RingsModel {
    const innerRadius = celestialBodyRadius * randRange(1.8, 2.2, rng, 1400);
    const ringWidth = celestialBodyRadius * Math.max(0.2, normalRandom(1.0, 0.5, rng, 1405));
    return {
        innerRadius: innerRadius,
        outerRadius: innerRadius + ringWidth,
        frequency: 30.0,
        opacity: clamp(normalRandom(0.7, 0.1, rng, 1420), 0, 1),
        color: new Color3(255, 225, 171).scaleInPlace(randRange(0.7, 1.2, rng, 1430) / 255),
        seed: randRange(-1, 1, rng, 1440),
    };
}
