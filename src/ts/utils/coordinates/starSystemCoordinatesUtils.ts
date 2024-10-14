import { StarSector } from "../../starmap/starSector";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StarSystemCoordinates } from "./universeCoordinates";

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
