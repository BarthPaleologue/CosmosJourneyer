import { perHaToPerM2 } from "@cosmos-journeyer/physics";
import { type CropType } from "@cosmos-journeyer/universe-model";

import { assertUnreachable } from "./types";

export type { CropType };

export const CropTypes: ReadonlyArray<CropType> = [
    "potato",
    "yam",
    "sweet_potato",
    "rice",
    "peanut",
    "wheat",
    "lentil",
    "cassava",
];

/**
 * Edible energy in kcal/m²/day for different plant species.
 * @see https://www.fao.org/4/t0207e/T0207E04.htm#4.%20Nutritive%20value
 */
export function getEdibleEnergyPerAreaPerDay(cropType: CropType): number {
    switch (cropType) {
        case "potato":
            return perHaToPerM2(54_000);
        case "yam":
            return perHaToPerM2(47_000);
        case "sweet_potato":
            return perHaToPerM2(70_000);
        case "rice":
            return perHaToPerM2(49_000);
        case "peanut":
            return perHaToPerM2(36_000);
        case "wheat":
            return perHaToPerM2(40_000);
        case "lentil":
            return perHaToPerM2(23_000);
        case "cassava":
            return perHaToPerM2(27_000);
        default:
            return assertUnreachable(cropType);
    }
}
