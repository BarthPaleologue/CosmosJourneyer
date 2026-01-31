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

import { haToM2 } from "./physics/unitConversions";
import { assertUnreachable } from "./types";

export const CropType = {
    POTATO: "potato",
    YAM: "yam",
    SWEET_POTATO: "sweet_potato",
    RICE: "rice",
    PEANUT: "peanut",
    WHEAT: "wheat",
    LENTIL: "lentil",
    CASSAVA: "cassava",
} as const;
export type CropType = (typeof CropType)[keyof typeof CropType];

export const CropTypes = Object.values(CropType);

/**
 * Edible energy in kcal/m²/day for different plant species
 * @see https://www.fao.org/4/t0207e/T0207E04.htm#4.%20Nutritive%20value
 */
export function getEdibleEnergyPerAreaPerDay(cropType: CropType): number {
    switch (cropType) {
        case CropType.POTATO:
            return 54_000 / haToM2(1);
        case CropType.YAM:
            return 47_000 / haToM2(1);
        case CropType.SWEET_POTATO:
            return 70_000 / haToM2(1);
        case CropType.RICE:
            return 49_000 / haToM2(1);
        case CropType.PEANUT:
            return 36_000 / haToM2(1);
        case CropType.WHEAT:
            return 40_000 / haToM2(1);
        case CropType.LENTIL:
            return 23_000 / haToM2(1);
        case CropType.CASSAVA:
            return 27_000 / haToM2(1);
        default:
            return assertUnreachable(cropType);
    }
}
