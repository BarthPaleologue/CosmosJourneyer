import { getStarGalacticCoordinates } from "./getStarGalacticCoordinates";
import { SystemSeed } from "./systemSeed";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StarSector } from "../starmap/starSector";

/**
 * Finds all systems within a given radius of the given system.
 * @param seed The seed of the system.
 * @param radius The radius of the search in light years.
 * @returns An array of tuples containing the seed of the system, the galactic coordinates of the system, and the distance to the system in light years.
 */
export function getNeighborStarSystems(seed: SystemSeed, radius: number): [SystemSeed, Vector3, number][] {
    const currentSystemCoordinates = getStarGalacticCoordinates(seed);
    const starSectorSize = StarSector.SIZE;
    const starSectorRadius = Math.ceil(radius / starSectorSize);

    const starSectors: StarSector[] = [];
    for (let x = seed.starSectorX - starSectorRadius; x <= seed.starSectorX + starSectorRadius; x++) {
        for (let y = seed.starSectorY - starSectorRadius; y <= seed.starSectorY + starSectorRadius; y++) {
            for (let z = seed.starSectorZ - starSectorRadius; z <= seed.starSectorZ + starSectorRadius; z++) {
                starSectors.push(new StarSector(new Vector3(x, y, z)));
            }
        }
    }

    return starSectors.flatMap((starSector) => {
        const starPositions = starSector.getPositionOfStars();
        return starPositions
            .map<[SystemSeed, Vector3, number]>((position, index) => {
                const distance = Vector3.Distance(position, currentSystemCoordinates);
                return [new SystemSeed(starSector.coordinates.x, starSector.coordinates.y, starSector.coordinates.z, index), position, distance];
            })
            .filter(([neighborSeed, position, distance]) => {
                return distance <= radius && neighborSeed.hash !== seed.hash;
            });
    });
}
