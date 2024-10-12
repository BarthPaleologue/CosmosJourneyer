import { StarSystemCoordinates } from "../saveFile/universeCoordinates";
import { StarSector } from "../starmap/starSector";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * Seed used to generate star systems in a pseudo-random fashion.
 */
export type SystemSeed = {
    /**
     * The X coordinate of the star sector (integer).
     */
    starSectorX: number;
    /**
     * The Y coordinate of the star sector (integer).
     */
    starSectorY: number;
    /**
     * The Z coordinate of the star sector (integer).
     */
    starSectorZ: number;
    /**
     * The index of the system inside its star sector (integer).
     */
    index: number;
};

export function getStarSystemCoordinatesFromSeed(systemSeed: SystemSeed): StarSystemCoordinates {
    const starSector = new StarSector(new Vector3(systemSeed.starSectorX, systemSeed.starSectorY, systemSeed.starSectorZ));
    const localPosition = starSector.getLocalPositionOfStar(systemSeed.index);

    return {
        starSectorX: systemSeed.starSectorX,
        starSectorY: systemSeed.starSectorY,
        starSectorZ: systemSeed.starSectorZ,
        localX: localPosition.x,
        localY: localPosition.y,
        localZ: localPosition.z
    };
}

/**
 * From a system coordinates, try to find the seed of the system.
 * @param coordinates The coordinates of the system.
 * @returns The seed of the system, or null if not found.
 */
export function getSeedFromCoordinates(coordinates: StarSystemCoordinates): SystemSeed | null {
    const starSector = new StarSector(new Vector3(coordinates.starSectorX, coordinates.starSectorY, coordinates.starSectorZ));
    const localPositions = starSector.getLocalPositionsOfStars();
    for (let i = 0; i < localPositions.length; i++) {
        const localPosition = localPositions[i];
        if (localPosition.equals(new Vector3(coordinates.localX, coordinates.localY, coordinates.localZ))) {
            return {
                starSectorX: coordinates.starSectorX,
                starSectorY: coordinates.starSectorY,
                starSectorZ: coordinates.starSectorZ,
                index: i
            };
        }
    }

    return null;
}
