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

export const AsteroidFieldMissionState = {
    NOT_IN_SYSTEM: "notInSystem",
    TOO_FAR_IN_SYSTEM: "tooFarInSystem",
    CLOSE_ENOUGH: "closeEnough",
} as const;

export type AsteroidFieldMissionState = (typeof AsteroidFieldMissionState)[keyof typeof AsteroidFieldMissionState];

function preprocessLegacyAsteroidFieldMissionState(state: unknown): unknown {
    if (typeof state !== "number") {
        return state;
    }

    switch (state) {
        case 0:
            return AsteroidFieldMissionState.NOT_IN_SYSTEM;
        case 1:
            return AsteroidFieldMissionState.TOO_FAR_IN_SYSTEM;
        case 2:
            return AsteroidFieldMissionState.CLOSE_ENOUGH;
        default:
            return state;
    }
}

export const MissionAsteroidFieldNodeSerializedSchema = z.object({
    type: z.literal("asteroid_field"),
    objectId: UniverseObjectIdSchema,
    state: z.preprocess((value) => preprocessLegacyAsteroidFieldMissionState(value), z.enum(AsteroidFieldMissionState)),
});

export type MissionAsteroidFieldNodeSerialized = z.infer<typeof MissionAsteroidFieldNodeSerializedSchema>;
