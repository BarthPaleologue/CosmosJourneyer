import { getStarGalacticPosition } from "./getStarGalacticPositionFromSeed";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StarSector } from "../starmap/starSector";
import { StarSystemCoordinates, starSystemCoordinatesEquals } from "../starSystem/starSystemModel";

export function getNeighborStarSystemCoordinates(starSystemCoordinates: StarSystemCoordinates, radius: number): [StarSystemCoordinates, Vector3, number][] {
    const currentSystemPosition = getStarGalacticPosition(starSystemCoordinates);
    const starSectorSize = StarSector.SIZE;
    const starSectorRadius = Math.ceil(radius / starSectorSize);

    const starSectors: StarSector[] = [];
    for (let x = starSystemCoordinates.starSectorX - starSectorRadius; x <= starSystemCoordinates.starSectorX + starSectorRadius; x++) {
        for (let y = starSystemCoordinates.starSectorY - starSectorRadius; y <= starSystemCoordinates.starSectorY + starSectorRadius; y++) {
            for (let z = starSystemCoordinates.starSectorZ - starSectorRadius; z <= starSystemCoordinates.starSectorZ + starSectorRadius; z++) {
                starSectors.push(new StarSector(new Vector3(x, y, z)));
            }
        }
    }

    return starSectors.flatMap((starSector) => {
        const starPositions = starSector.getPositionOfStars();
        const starLocalPositions = starSector.getLocalPositionsOfStars();
        return starPositions
            .map<[StarSystemCoordinates, Vector3, number]>((position, index) => {
                const distance = Vector3.Distance(position, currentSystemPosition);
                return [
                    {
                        starSectorX: starSector.coordinates.x,
                        starSectorY: starSector.coordinates.y,
                        starSectorZ: starSector.coordinates.z,
                        localX: starLocalPositions[index].x,
                        localY: starLocalPositions[index].y,
                        localZ: starLocalPositions[index].z
                    },
                    position,
                    distance
                ];
            })
            .filter(([neighborCoordinates, position, distance]) => {
                return distance <= radius && !starSystemCoordinatesEquals(neighborCoordinates, starSystemCoordinates);
            });
    });
}
