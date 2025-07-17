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

import { normalRandom, randRange } from "extended-random";

import { type RGBColor } from "@/utils/colors";

type RingsModelBase = {
    /**
     * The closest distance between the rings and the center of the celestial body in meters
     */
    innerRadius: number;

    /**
     * The farthest distance between the rings and the center of the celestial body in meters
     */
    outerRadius: number;
};

export type ProceduralRingsModel = RingsModelBase & {
    type: "procedural";

    /**
     * The seed used for randomness
     */
    seed: number;

    /**
     * The frequency of the stripes pattern
     */
    frequency: number;

    /**
     * The main color of the rings in RGB color space
     */
    albedo: RGBColor;
};

export type TexturedRingsModel = RingsModelBase & {
    type: "textured";

    /**
     * The id of the texture used for the rings
     */
    textureId: "saturn" | "uranus";
};

/**
 * Represents the rings of a celestial body
 */
export type RingsModel = ProceduralRingsModel | TexturedRingsModel;

export function newSeededRingsModel(celestialBodyRadius: number, rng: (step: number) => number): RingsModel {
    const innerRadius = celestialBodyRadius * randRange(1.8, 2.2, rng, 1400);
    const ringWidth = celestialBodyRadius * Math.max(0.2, normalRandom(1.0, 0.5, rng, 1405));

    const albedoMultiplier = randRange(0.7, 1.2, rng, 1430) / 255;

    return {
        innerRadius: innerRadius,
        outerRadius: innerRadius + ringWidth,
        type: "procedural",
        seed: randRange(-1, 1, rng, 1440),
        frequency: 10.0,
        albedo: { r: 120 * albedoMultiplier, g: 112 * albedoMultiplier, b: 104 * albedoMultiplier },
    };
}
