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

import { OrbitalObjectModel } from "../../architecture/orbitalObjectModel";
import { StarSystemModel } from "../../starSystem/starSystemModel";
import { DeepReadonly } from "../types";
import { OrbitalObjectId, orbitalObjectIdEquals } from "./orbitalObjectId";
import { StarSystemCoordinates, starSystemCoordinatesEquals } from "./starSystemCoordinates";

/**
 * Data structure that can identify any object within the universe.
 */
export type UniverseObjectId = {
    /**
     * The coordinates of the star system.
     */
    starSystemCoordinates: StarSystemCoordinates;

    /**
     * The id of the object (unique within the star system)
     */
    systemId: OrbitalObjectId;
};

export function universeObjectIdEquals(a: UniverseObjectId, b: UniverseObjectId): boolean {
    return (
        orbitalObjectIdEquals(a.systemId, b.systemId) &&
        starSystemCoordinatesEquals(a.starSystemCoordinates, b.starSystemCoordinates)
    );
}

/**
 * Get the universe object ID of the given orbital object within the star system.
 * @param orbitalObject An orbital object within the star system.
 * @param starSystem The star system controller.
 */
export function getUniverseObjectId(
    orbitalObject: DeepReadonly<OrbitalObjectModel>,
    starSystem: DeepReadonly<StarSystemModel>
): UniverseObjectId {
    return {
        starSystemCoordinates: starSystem.coordinates,
        systemId: orbitalObject.id
    };
}
