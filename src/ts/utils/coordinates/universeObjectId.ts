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
import { StarSystemCoordinatesSchema, starSystemCoordinatesEquals } from "./starSystemCoordinates";
import { systemObjectIdEquals, SystemObjectIdSchema } from "./universeCoordinates";

export const UniverseObjectIdSchema = z.object({
    ...SystemObjectIdSchema.shape,

    /** The coordinates of the star system. */
    starSystemCoordinates: StarSystemCoordinatesSchema
});

/**
 * Data structure that can identify any object within the universe.
 */
export type UniverseObjectId = z.infer<typeof UniverseObjectIdSchema>;

export function universeObjectIdEquals(a: UniverseObjectId, b: UniverseObjectId): boolean {
    return systemObjectIdEquals(a, b) && starSystemCoordinatesEquals(a.starSystemCoordinates, b.starSystemCoordinates);
}
