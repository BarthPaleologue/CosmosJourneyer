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

import { CompletedTutorialsSchema } from "@/backend/player/serializedPlayer";
import { StarSystemCoordinatesSchema } from "@/backend/universe/starSystemCoordinates";

import { err, ok, type Result } from "@/utils/types";

import projectInfo from "../../../../../package.json";
import { type SaveLoadingError } from "../saveLoadingError";

export const SystemObjectType = {
    STELLAR_OBJECT: 0,
    PLANETARY_MASS_OBJECT: 1,
    ANOMALY: 2,
    ORBITAL_FACILITY: 3,
} as const;

const SystemObjectIdSchema = z.object({
    /**
     * The type of the object.
     */
    objectType: z.enum(SystemObjectType),

    /**
     * The index of the object inside the array containing all objects of the given type within the star system.
     */
    objectIndex: z.number(),
});

const UniverseObjectIdSchema = z.object({
    ...SystemObjectIdSchema.shape,

    /** The coordinates of the star system. */
    starSystemCoordinates: StarSystemCoordinatesSchema,
});

const ShipType = {
    WANDERER: 0,
} as const;

const SerializedFuelTankSchema = z.object({
    currentFuel: z.number(),
    maxFuel: z.number(),
});

const SerializedFuelScoopSchema = z.object({
    fuelPerSecond: z.number().default(1),
});

const SerializedSpaceshipSchemaV1 = z.object({
    id: z.uuid().default(() => crypto.randomUUID()),
    name: z.string().default("Wanderer"),
    type: z.enum(ShipType).default(ShipType.WANDERER),
    fuelTanks: z.array(SerializedFuelTankSchema).default([{ currentFuel: 100, maxFuel: 100 }]),
    fuelScoop: z.nullable(SerializedFuelScoopSchema).nullable().default({ fuelPerSecond: 2.5 }),
});

const SpaceDiscoveryDataSchema = z.object({
    /**
     * The ID of the object discovered.
     */
    objectId: UniverseObjectIdSchema,
    /**
     * The timestamp at which the object was discovered.
     */
    discoveryTimestamp: z.number().default(0),
    /**
     * The name of the explorer who discovered the object.
     */
    explorerName: z.string().default("Unknown"),
});

export const SaveSchemaV1 = z.object({
    /** The version of CosmosJourneyer that created this save file. */
    version: z.string().default(projectInfo.version),

    /** The timestamp when the save file was created. */
    timestamp: z.number().default(() => Date.now()),

    /** The player data. */
    player: z.object({
        uuid: z.string().default(() => crypto.randomUUID()),
        name: z.string().default("Python"),
        balance: z.number().default(10000),
        creationDate: z.string().default(new Date().toISOString()),
        timePlayedSeconds: z.number().default(0),
        visitedSystemHistory: z.array(StarSystemCoordinatesSchema).default([]),
        discoveries: z
            .object({
                local: z.array(SpaceDiscoveryDataSchema).default([]),
                uploaded: z.array(SpaceDiscoveryDataSchema).default([]),
            })
            .default({
                local: [],
                uploaded: [],
            }),
        currentItinerary: z.array(StarSystemCoordinatesSchema).default([]),
        systemBookmarks: z.array(StarSystemCoordinatesSchema).default([]),
        currentMissions: z.array(z.unknown()).default([]),
        completedMissions: z.array(z.unknown()).default([]),
        spaceShips: z.array(SerializedSpaceshipSchemaV1).default([SerializedSpaceshipSchemaV1.parse({})]),
        tutorials: CompletedTutorialsSchema.default({
            flightCompleted: false,
            stationLandingCompleted: false,
            starMapCompleted: false,
            fuelScoopingCompleted: false,
        }),
    }),

    /** The coordinates of the current star system and the coordinates inside the star system. */
    universeCoordinates: z.object({
        /**
         * The coordinates of the body in the universe.
         */
        universeObjectId: z.object({
            /**
             * The type of the object.
             */
            objectType: z.enum(SystemObjectType),

            /**
             * The index of the object inside the array containing all objects of the given type within the star system.
             */
            objectIndex: z.number(),

            /** The coordinates of the star system. */
            starSystemCoordinates: StarSystemCoordinatesSchema,
        }),

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
        rotationQuaternionW: z.number().default(1),
    }),

    /** If the player is landed at a facility, store the pad number to allow graceful respawn at the station. */
    padNumber: z.number().optional(),
});

/**
 * Data structure for the save file to allow restoring current star system and position.
 */
export type SaveV1 = z.infer<typeof SaveSchemaV1>;

export function safeParseSaveV1(json: Record<string, unknown>): Result<SaveV1, SaveLoadingError> {
    const result = SaveSchemaV1.safeParse(json);
    if (result.success) {
        return ok(result.data);
    }

    return err({ type: "INVALID_SAVE", content: result.error });
}
