import { getObjectBySystemId } from "../utils/orbitalObjectId";
import { StarSystemController } from "../starSystem/starSystemController";
import { CelestialBody } from "../architecture/celestialBody";

/**
 * Analyzes the given star system to return the indices of the orbital objects that are space stations.
 * @param starSystemController
 */
export function placeSpaceStations(starSystemController: StarSystemController): CelestialBody[] {
    return starSystemController.model.spaceStations.map((station) => getObjectBySystemId(station.parent, starSystemController) as CelestialBody);
}
