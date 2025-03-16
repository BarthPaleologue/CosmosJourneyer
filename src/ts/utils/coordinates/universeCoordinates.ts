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

export const StarSystemCoordinatesSchema = z.object({
    /**
     * Integer coordinates of the star sector along the universe X axis
     */
    starSectorX: z.number(),
    /**
     * Integer coordinates of the star sector along the universe Y axis
     */
    starSectorY: z.number(),
    /**
     * Integer coordinates of the star sector along the universe Z axis
     */
    starSectorZ: z.number(),
    /**
     * Floating point X coordinate of the star system inside the star sector. Must be between -0.5 and 0.5.
     */
    localX: z.number(),
    /**
     * Floating point Y coordinate of the star system inside the star sector. Must be between -0.5 and 0.5.
     */
    localY: z.number(),
    /**
     * Floating point Z coordinate of the star system inside the star sector. Must be between -0.5 and 0.5.
     */
    localZ: z.number()
});

/**
 * Describes the coordinates of a star system in the universe
 */
export type StarSystemCoordinates = z.infer<typeof StarSystemCoordinatesSchema>;

export function starSystemCoordinatesEquals(a: StarSystemCoordinates, b: StarSystemCoordinates): boolean {
    return (
        a.starSectorX === b.starSectorX &&
        a.starSectorY === b.starSectorY &&
        a.starSectorZ === b.starSectorZ &&
        a.localX === b.localX &&
        a.localY === b.localY &&
        a.localZ === b.localZ
    );
}

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
