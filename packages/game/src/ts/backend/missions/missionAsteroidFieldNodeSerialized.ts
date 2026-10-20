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

import { UniverseObjectIdSchema } from "@cosmos-journeyer/universe-model";
import { z } from "zod";

export const AsteroidFieldMissionState = {
    NOT_IN_SYSTEM: "notInSystem",
    TOO_FAR_IN_SYSTEM: "tooFarInSystem",
    CLOSE_ENOUGH: "closeEnough",
} as const;

export type AsteroidFieldMissionState = (typeof AsteroidFieldMissionState)[keyof typeof AsteroidFieldMissionState];

/**
 * @param state - Legacy numeric value or already-string asteroid-field mission state.
 * @returns Mapped state for values 0–2; other values pass through for schema validation.
 */
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
