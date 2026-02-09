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

import { randRangeInt } from "extended-random";

import type { HelixHabitatModel } from "@/backend/universe/orbitalObjects/orbitalFacilities/sections/habitats/helix";

import { getRngFromSeed } from "@/utils/getRngFromSeed";

export function generateHelixHabitatModel(seed: number, surface: HelixHabitatModel["surface"]): HelixHabitatModel {
    const rng = getRngFromSeed(seed);
    const baseRadius = 10e3 + rng(0) * 10e3;
    const deltaRadius = 700 + rng(1) * 200;
    const helixCount = randRangeInt(2, 4, rng, 654);
    const thicknessFactor = randRangeInt(1, 5 - helixCount, rng, 150);
    const helixPitchMultiplier = 1 + 0.3 * (rng(2) * 2 - 1);
    const attachmentTessellation = 6 + 2 * Math.floor(rng(4) * 2);
    return {
        type: "helixHabitat",
        surface,
        baseRadius,
        deltaRadius,
        helixCount,
        thicknessFactor,
        helixPitchMultiplier,
        attachmentTessellation,
    };
}
