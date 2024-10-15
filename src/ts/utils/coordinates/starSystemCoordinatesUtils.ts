import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StarSystemCoordinates } from "./universeCoordinates";
import { Settings } from "../../settings";

/**
 * Get the galactic position of a star system in the universe in light years.
 * @param coordinates The coordinates of the star system.
 */
export function getStarGalacticPosition(coordinates: StarSystemCoordinates) {
    return new Vector3(
        (coordinates.starSectorX + coordinates.localX) * Settings.STAR_SECTOR_SIZE,
        (coordinates.starSectorY + coordinates.localY) * Settings.STAR_SECTOR_SIZE,
        (coordinates.starSectorZ + coordinates.localZ) * Settings.STAR_SECTOR_SIZE
    );
}
