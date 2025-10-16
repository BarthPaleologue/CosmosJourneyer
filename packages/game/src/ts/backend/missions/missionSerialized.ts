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
export const MissionType = {
    SIGHT_SEEING_FLY_BY: "sightSeeingFlyBy",
    SIGHT_SEEING_TERMINATOR_LANDING: "sightSeeingTerminatorLanding",
    SIGHT_SEEING_ASTEROID_FIELD: "sightSeeingAsteroidField",
} as const;

export type MissionType = (typeof MissionType)[keyof typeof MissionType];
function preprocessLegacyMissionType(type: unknown): unknown {
    if (typeof type !== "number") {
        return type;
    }

    switch (type) {
        case 0:
            return MissionType.SIGHT_SEEING_FLY_BY;
        case 1:
            return MissionType.SIGHT_SEEING_TERMINATOR_LANDING;
        case 2:
            return MissionType.SIGHT_SEEING_ASTEROID_FIELD;
        default:
            return type;
    }
}

export const MissionSerializedSchema = z.object({
    missionGiver: UniverseObjectIdSchema,
    tree: MissionNodeSerializedSchema,
    reward: z.number().default(0),
    type: z
        .preprocess((value) => preprocessLegacyMissionType(value), z.enum(MissionType))
        .default(MissionType.SIGHT_SEEING_FLY_BY),
});

/**
 * Serialized mission object as stored in save files
 */
export type MissionSerialized = z.infer<typeof MissionSerializedSchema>;
