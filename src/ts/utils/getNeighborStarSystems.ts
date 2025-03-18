//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StarSystemCoordinates, starSystemCoordinatesEquals } from "./coordinates/starSystemCoordinates";
import { Settings } from "../settings";
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";

export function getNeighborStarSystemCoordinates(
    starSystemCoordinates: StarSystemCoordinates,
    radius: number,
    starSystemDatabase: StarSystemDatabase
): [StarSystemCoordinates, Vector3, number][] {
    const currentSystemPosition = starSystemDatabase.getSystemGalacticPosition(starSystemCoordinates);
    const starSectorSize = Settings.STAR_SECTOR_SIZE;
    const starSectorRadius = Math.ceil(radius / starSectorSize);

    const starSectorCoordinates: Vector3[] = [];
    for (
        let x = starSystemCoordinates.starSectorX - starSectorRadius;
        x <= starSystemCoordinates.starSectorX + starSectorRadius;
        x++
    ) {
        for (
            let y = starSystemCoordinates.starSectorY - starSectorRadius;
            y <= starSystemCoordinates.starSectorY + starSectorRadius;
            y++
        ) {
            for (
                let z = starSystemCoordinates.starSectorZ - starSectorRadius;
                z <= starSystemCoordinates.starSectorZ + starSectorRadius;
                z++
            ) {
                starSectorCoordinates.push(new Vector3(x, y, z));
            }
        }
    }

    return starSectorCoordinates.flatMap((starSector) => {
        const starPositions = starSystemDatabase.getSystemPositionsInStarSector(
            starSector.x,
            starSector.y,
            starSector.z
        );
        const systemCoordinates = starSystemDatabase.getSystemCoordinatesInStarSector(
            starSector.x,
            starSector.y,
            starSector.z
        );
        return starPositions
            .map<[StarSystemCoordinates, Vector3, number]>((position, index) => {
                const distance = Vector3.Distance(position, currentSystemPosition);
                return [systemCoordinates[index], position, distance];
            })
            .filter(([neighborCoordinates, position, distance]) => {
                return distance <= radius && !starSystemCoordinatesEquals(neighborCoordinates, starSystemCoordinates);
            });
    });
}
