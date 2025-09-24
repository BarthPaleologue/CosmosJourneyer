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

import { UniverseObjectIdSchema } from "@/backend/universe/universeObjectId";

import { MissionNodeSerializedSchema } from "./missionNodeSerialized";

/**
 * Registered mission types. Those are used to display localized strings in the UI
 */
export enum MissionType {
    SIGHT_SEEING_FLY_BY,
    SIGHT_SEEING_TERMINATOR_LANDING,
    SIGHT_SEEING_ASTEROID_FIELD,
}

export const MissionSerializedSchema = z.object({
    missionGiver: UniverseObjectIdSchema,
    tree: MissionNodeSerializedSchema,
    reward: z.number().default(0),
    type: z.nativeEnum(MissionType).default(MissionType.SIGHT_SEEING_FLY_BY),
});

/**
 * Serialized mission object as stored in save files
 */
export type MissionSerialized = z.infer<typeof MissionSerializedSchema>;
