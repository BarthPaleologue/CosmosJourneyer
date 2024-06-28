export const enum CropType {
    POTATO,
    YAM,
    SWEET_POTATO,
    RICE,
    PEANUT,
    WHEAT,
    LENTIL,
    CASSAVA
}

/**
 * Edible energy in kcal/ha/day for different plant species
 * @see https://www.fao.org/4/t0207e/T0207E04.htm#4.%20Nutritive%20value
 */
export function getEdibleEnergyPerHaPerDay(cropType: CropType): number {
    switch (cropType) {
        case CropType.POTATO:
            return 54_000;
        case CropType.YAM:
            return 47_000;
        case CropType.SWEET_POTATO:
            return 70_000;
        case CropType.RICE:
            return 49_000;
        case CropType.PEANUT:
            return 36_000;
        case CropType.WHEAT:
            return 40_000;
        case CropType.LENTIL:
            return 23_000;
        case CropType.CASSAVA:
            return 27_000;
        default:
            throw new Error("Unknown crop type");
    }
}