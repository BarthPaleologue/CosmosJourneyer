import { SystemSeed } from "./systemSeed";
import { StarSector } from "../starmap/starSector";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export function getStarGalacticCoordinates(systemSeed: SystemSeed) {
    const starSector = new StarSector(new Vector3(systemSeed.starSectorX, systemSeed.starSectorY, systemSeed.starSectorZ));
    return starSector.getPositionOfStar(systemSeed.index);
}
