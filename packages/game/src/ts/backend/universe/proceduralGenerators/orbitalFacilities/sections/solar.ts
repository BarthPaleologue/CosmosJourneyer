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

import type { SolarSectionModel } from "@/backend/universe/orbitalObjects/orbitalFacilities/sections/solar";

import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { wheelOfFortune } from "@/utils/random";

export function generateSolarSectionModel(seed: number, surface: number): SolarSectionModel {
    const rng = getRngFromSeed(seed);
    const axisCount = wheelOfFortune(
        [
            [1, 0.1],
            [2, 0.3],
            [3, 0.3],
            [4, 0.2],
            [5, 0.1],
        ],
        rng(0),
    );
    const secondaryArmCount = axisCount === 2 ? randRangeInt(2, 4, rng, 777) : undefined;
    return {
        type: "solar",
        surface,
        axisCount,
        secondaryArmCount,
    };
}
