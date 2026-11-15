//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { GenerationSteps } from "#/utils/generationSteps";
import { EarthMagneticDipoleMoment, EarthRadius } from "@cosmos-journeyer/physics";
import { normalRandom, randRange, uniformRandBool } from "@cosmos-journeyer/random";
import type { IndexedRng } from "@cosmos-journeyer/random";
import type { MagneticFieldModel } from "@cosmos-journeyer/universe-model";

/**
 * @param radius Body radius in meters.
 * @param dynamoProbability Heuristic probability of an active global dynamo.
 * @param rng Indexed random source for reproducible sampling.
 * @returns An intrinsic dipole, or null when the dynamo is absent.
 */
export function generateTelluricMagneticFieldModel(
    radius: number,
    dynamoProbability: number,
    rng: IndexedRng,
): MagneticFieldModel | null {
    if (!uniformRandBool(dynamoProbability, rng, GenerationSteps.MAGNETIC_FIELD)) {
        return null;
    }

    // Heuristic surface strengths: median 0.1 Earth, with a tail above Earth's field.
    const relativeStrength = 10 ** normalRandom(-1, 0.7, rng, GenerationSteps.MAGNETIC_FIELD + 1);

    return {
        north: {
            latitude: Math.PI / 2 - randRange(0, Math.PI / 3, rng, GenerationSteps.MAGNETIC_FIELD + 3),
            longitude: randRange(0, 2 * Math.PI, rng, GenerationSteps.MAGNETIC_FIELD + 4),
        },
        magnitude: EarthMagneticDipoleMoment * relativeStrength * (radius / EarthRadius) ** 3,
    };
}
