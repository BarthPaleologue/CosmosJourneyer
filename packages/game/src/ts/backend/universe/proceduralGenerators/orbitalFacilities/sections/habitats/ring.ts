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

import type { RingHabitatModel } from "@/backend/universe/orbitalObjects/orbitalFacilities/sections/habitats/ring";

import { getRngFromSeed } from "@/utils/getRngFromSeed";

export function generateRingHabitatModel(seed: number, surface: RingHabitatModel["surface"]): RingHabitatModel {
    const rng = getRngFromSeed(seed);
    const baseRadius = 5e3 + rng(0) * 10e3;
    const attachmentTessellation = 4 + 2 * Math.floor(rng(1) * 2);
    return {
        type: "ringHabitat",
        surface,
        baseRadius,
        attachmentTessellation,
    };
}
