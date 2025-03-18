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
import { UniverseObjectIdSchema } from "./universeObjectId";

export enum SystemObjectType {
    STELLAR_OBJECT,
    PLANETARY_MASS_OBJECT,
    ANOMALY,
    ORBITAL_FACILITY
}

export const SystemObjectIdSchema = z.object({
    /**
     * The type of the object.
     */
    objectType: z.nativeEnum(SystemObjectType),

    /**
     * The index of the object inside the array containing all objects of the given type within the star system.
     */
    objectIndex: z.number()
});

export type SystemObjectId = z.infer<typeof SystemObjectIdSchema>;

export function systemObjectIdEquals(a: SystemObjectId, b: SystemObjectId): boolean {
    return a.objectType === b.objectType && a.objectIndex === b.objectIndex;
}

export const UniverseCoordinatesSchema = z.object({
    /**
     * The coordinates of the body in the universe.
     */
    universeObjectId: UniverseObjectIdSchema,

    /**
     * The x coordinate of the player's position in the nearest orbital object's frame of reference.
     */
    positionX: z.number().default(0),

    /**
     * The y coordinate of the player's position in the nearest orbital object's frame of reference.
     */
    positionY: z.number().default(0),

    /**
     * The z coordinate of the player's position in the nearest orbital object's frame of reference.
     */
    positionZ: z.number().default(0),

    /**
     * The x component of the player's rotation quaternion in the nearest orbital object's frame of reference.
     */
    rotationQuaternionX: z.number().default(0),

    /**
     * The y component of the player's rotation quaternion in the nearest orbital object's frame of reference.
     */
    rotationQuaternionY: z.number().default(0),

    /**
     * The z component of the player's rotation quaternion in the nearest orbital object's frame of reference.
     */
    rotationQuaternionZ: z.number().default(0),

    /**
     * The w component of the player's rotation quaternion in the nearest orbital object's frame of reference.
     */
    rotationQuaternionW: z.number().default(1)
});

export type UniverseCoordinates = z.infer<typeof UniverseCoordinatesSchema>;
