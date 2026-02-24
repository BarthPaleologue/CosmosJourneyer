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

export const FlyByState = {
    NOT_IN_SYSTEM: "notInSystem",
    TOO_FAR_IN_SYSTEM: "tooFarInSystem",
    CLOSE_ENOUGH: "closeEnough",
} as const;

export type FlyByState = (typeof FlyByState)[keyof typeof FlyByState];

function preprocessLegacyFlyByState(state: unknown): unknown {
    if (typeof state !== "number") {
        return state;
    }

    switch (state) {
        case 0:
            return FlyByState.NOT_IN_SYSTEM;
        case 1:
            return FlyByState.TOO_FAR_IN_SYSTEM;
        case 2:
            return FlyByState.CLOSE_ENOUGH;
        default:
            return state;
    }
}

export const MissionFlyByNodeSerializedSchema = z.object({
    type: z.literal("fly_by"),
    objectId: UniverseObjectIdSchema,
    state: z.preprocess((value) => preprocessLegacyFlyByState(value), z.enum(FlyByState)),
});

export type MissionFlyByNodeSerialized = z.infer<typeof MissionFlyByNodeSerializedSchema>;
