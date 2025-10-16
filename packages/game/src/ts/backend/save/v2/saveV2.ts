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

import { ItinerarySchema, SerializedPlayerSchema, type Itinerary } from "@/backend/player/serializedPlayer";
import { getDefaultSerializedSpaceship } from "@/backend/spaceship/serializedSpaceship";
import { type OrbitalObjectModel } from "@/backend/universe/orbitalObjects/index";
import { type UniverseBackend } from "@/backend/universe/universeBackend";

import { ok, type DeepReadonly, type Result } from "@/utils/types";

import { type SaveLoadingError } from "../saveLoadingError";
import { UniverseCoordinatesSchema, type UniverseCoordinates } from "../universeCoordinates";
import { safeParseSaveV1, SystemObjectType, type SaveV1 } from "../v1/saveV1";

export const SaveSchemaV2 = z.object({
    uuid: z.string().default(() => crypto.randomUUID()),

    /** The timestamp when the save file was created. */
    timestamp: z.number().default(() => Date.now()),

    /** The player data. */
    player: SerializedPlayerSchema,

    playerLocation: UniverseCoordinatesSchema,

    shipLocations: z.record(z.uuid(), UniverseCoordinatesSchema),

    thumbnail: z.string().optional(),
});

/**
 * Data structure for the save file to allow restoring current star system and position.
 */
export type SaveV2 = z.infer<typeof SaveSchemaV2>;

export function migrateV1ToV2(saveV1: SaveV1, universeBackend: UniverseBackend): SaveV2 {
    const systemModel =
        universeBackend.getSystemModelFromCoordinates(
            saveV1.universeCoordinates.universeObjectId.starSystemCoordinates,
        ) ?? universeBackend.fallbackSystem;

    let closestObject: DeepReadonly<OrbitalObjectModel> | undefined;
    let radius: number | undefined;
    switch (saveV1.universeCoordinates.universeObjectId.objectType) {
        case SystemObjectType.STELLAR_OBJECT:
            closestObject = systemModel.stellarObjects.at(saveV1.universeCoordinates.universeObjectId.objectIndex);
            radius = closestObject?.radius;
            break;
        case SystemObjectType.PLANETARY_MASS_OBJECT:
            closestObject = systemModel.planets.at(0);
            radius = closestObject?.radius;
            break;
        case SystemObjectType.ANOMALY:
            closestObject = systemModel.anomalies.at(saveV1.universeCoordinates.universeObjectId.objectIndex);
            radius = closestObject?.radius;
            break;
        case SystemObjectType.ORBITAL_FACILITY:
            closestObject = systemModel.orbitalFacilities.at(saveV1.universeCoordinates.universeObjectId.objectIndex);
            radius = 40e3;
            break;
    }

    closestObject ??= systemModel.stellarObjects[0];
    radius ??= systemModel.stellarObjects[0].radius;

    const spaceship = saveV1.player.spaceShips[0] ?? getDefaultSerializedSpaceship();

    let shipLocation: UniverseCoordinates;
    if (saveV1.padNumber !== undefined) {
        shipLocation = {
            type: "atStation",
            universeObjectId: {
                systemCoordinates: systemModel.coordinates,
                idInSystem: closestObject.id,
            },
        };
    } else {
        shipLocation = {
            type: "relative",
            universeObjectId: {
                systemCoordinates: systemModel.coordinates,
                idInSystem: closestObject.id,
            },
            position: { x: 0, y: 0, z: -radius * 3 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
        };
    }

    const parsedItinerary = ItinerarySchema.safeParse(saveV1.player.currentItinerary);
    let itinerary: Itinerary | null = null;
    if (parsedItinerary.success) {
        itinerary = parsedItinerary.data;
    }

    return {
        uuid: crypto.randomUUID(),
        timestamp: saveV1.timestamp,
        player: {
            uuid: saveV1.player.uuid,
            name: saveV1.player.name,
            balance: saveV1.player.balance,
            creationDate: saveV1.player.creationDate,
            timePlayedSeconds: saveV1.player.timePlayedSeconds,
            visitedSystemHistory: saveV1.player.visitedSystemHistory,
            discoveries: {
                local: [],
                uploaded: [],
            },
            currentItinerary: itinerary,
            systemBookmarks: saveV1.player.systemBookmarks,
            currentMissions: [],
            completedMissions: [],
            spaceShips: [getDefaultSerializedSpaceship()],
            spareSpaceshipComponents: [],
            tutorials: saveV1.player.tutorials,
        },
        playerLocation: {
            type: "inSpaceship",
            shipId: spaceship.id,
        },
        shipLocations: {
            [spaceship.id]: shipLocation,
        },
    };
}

export function safeParseSaveV2(
    json: Record<string, unknown>,
    universeBackend: UniverseBackend,
): Result<SaveV2, SaveLoadingError> {
    const result = SaveSchemaV2.safeParse(json);
    if (result.success) {
        return ok(result.data);
    }

    const parseV1Result = safeParseSaveV1(json);
    if (parseV1Result.success) {
        return ok(migrateV1ToV2(parseV1Result.value, universeBackend));
    }

    return parseV1Result;
}
