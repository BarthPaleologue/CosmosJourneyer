import { SystemSeed } from "./systemSeed";
import { StarSector } from "../starmap/starSector";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * Get the galactic coordinates of a star system in light years.
 * @param systemSeed The seed of the star system.
 */
export function getStarGalacticCoordinates(systemSeed: SystemSeed) {
    const starSector = new StarSector(new Vector3(systemSeed.starSectorX, systemSeed.starSectorY, systemSeed.starSectorZ));
    return starSector.getPositionOfStar(systemSeed.index);
}
