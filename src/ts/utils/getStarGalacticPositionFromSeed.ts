import { SystemSeed } from "./systemSeed";
import { StarSector } from "../starmap/starSector";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StarSystemCoordinates } from "../starSystem/starSystemModel";

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
export function getSeedFromCoordinates(coordinates: StarSystemCoordinates) {
    const starSector = new StarSector(new Vector3(coordinates.starSectorX, coordinates.starSectorY, coordinates.starSectorZ));
    const localPositions = starSector.getLocalPositionsOfStars();
    for (const localPosition of localPositions) {
        if (localPosition.equals(new Vector3(coordinates.localX, coordinates.localY, coordinates.localZ))) {
            return new SystemSeed(coordinates.starSectorX, coordinates.starSectorY, coordinates.starSectorZ, localPositions.indexOf(localPosition));
        }
    }

    return null;
}
