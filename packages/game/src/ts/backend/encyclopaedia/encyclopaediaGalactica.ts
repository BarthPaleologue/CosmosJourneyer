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

import { UniverseObjectIdSchema, type UniverseObjectId } from "@/backend/universe/universeObjectId";

import { type Result } from "@/utils/types";

export const SpaceDiscoveryDataSchema = z.object({
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

/**
 * Information about a space discovery
 */
export type SpaceDiscoveryData = z.infer<typeof SpaceDiscoveryDataSchema>;

/**
 * Database holding all the exploration data gathered by players.
 */
export interface EncyclopaediaGalactica {
    /**
     * Tries to add a new astronomical object to the database under the given explorer name.
     * @param data The space exploration data to add.
     * @returns True if the object was added, false if it was already present.
     */
    contributeDiscoveryIfNew(data: SpaceDiscoveryData): Promise<boolean>;

    /**
     * Finds out if an object has already been discovered.
     * @param objectId The ID of the object to check.
     * @returns True if the object has been discovered, false otherwise.
     */
    hasObjectBeenDiscovered(objectId: UniverseObjectId): Promise<boolean>;

    /**
     * Estimates the value of an astronomical object given the current encyclopaedia data.
     * @param object The object to evaluate.
     * @returns The estimated value of the object in credits.
     */
    estimateDiscovery(object: UniverseObjectId): Promise<Result<number, string>>;

    /**
     * Gets a human readable string for the encyclopaedia backend.
     */
    getBackendString(): string;
}
