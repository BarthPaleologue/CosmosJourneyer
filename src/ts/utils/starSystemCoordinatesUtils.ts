import { StarSector } from "../starmap/starSector";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SeededStarSystemModel, SystemSeed } from "../starSystem/seededStarSystemModel";
import { StarSystemCoordinates } from "../saveFile/universeCoordinates";

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
 * Get the galactic position of a star system in the universe in light years.
 * @param coordinates The coordinates of the star system.
 */
export function getStarGalacticPosition(coordinates: StarSystemCoordinates) {
    return new Vector3(
        (coordinates.starSectorX + coordinates.localX) * StarSector.SIZE,
        (coordinates.starSectorY + coordinates.localY) * StarSector.SIZE,
        (coordinates.starSectorZ + coordinates.localZ) * StarSector.SIZE
    );
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

export function getSystemModelFromCoordinates(coordinates: StarSystemCoordinates) {
    const seed = getSeedFromCoordinates(coordinates);
    if (seed === null) {
        throw new Error("No seed found for coordinates. Custom star systems are not supported in system targets yet.");
    }
    return new SeededStarSystemModel(seed);
}
