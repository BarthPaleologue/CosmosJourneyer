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

import { z } from "zod";

import { type DeepReadonly } from "@/utils/types";

import { type OrbitalObjectModel } from "./orbitalObjects/index";
import { orbitalObjectIdEquals, OrbitalObjectIdSchema } from "./orbitalObjects/orbitalObjectId";
import { starSystemCoordinatesEquals, StarSystemCoordinatesSchema } from "./starSystemCoordinates";
import { type StarSystemModel } from "./starSystemModel";

export const UniverseObjectIdSchema = z.object({
    idInSystem: OrbitalObjectIdSchema,

    /** The coordinates of the star system. */
    systemCoordinates: StarSystemCoordinatesSchema,
});

/**
 * Data structure that can identify any object within the universe.
 */
export type UniverseObjectId = z.infer<typeof UniverseObjectIdSchema>;

export function universeObjectIdEquals(a: UniverseObjectId, b: UniverseObjectId): boolean {
    return (
        orbitalObjectIdEquals(a.idInSystem, b.idInSystem) &&
        starSystemCoordinatesEquals(a.systemCoordinates, b.systemCoordinates)
    );
}

/**
 * Get the universe object ID of the given orbital object within the star system.
 * @param orbitalObject An orbital object within the star system.
 * @param starSystem The star system controller.
 */
export function getUniverseObjectId(
    orbitalObject: DeepReadonly<OrbitalObjectModel>,
    starSystem: DeepReadonly<StarSystemModel>,
): UniverseObjectId {
    return {
        systemCoordinates: starSystem.coordinates,
        idInSystem: orbitalObject.id,
    };
}
