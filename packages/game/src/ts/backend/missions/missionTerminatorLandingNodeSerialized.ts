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

import { MissionNodeType } from "./missionNodeType";

export const LandMissionState = {
    NOT_IN_SYSTEM: "notInSystem",
    TOO_FAR_IN_SYSTEM: "tooFarInSystem",
    LANDED: "landed",
} as const;

export type LandMissionState = (typeof LandMissionState)[keyof typeof LandMissionState];

function preprocessLegacyLandMissionState(state: unknown): unknown {
    if (typeof state !== "number") {
        return state;
    }

    switch (state) {
        case 0:
            return LandMissionState.NOT_IN_SYSTEM;
        case 1:
            return LandMissionState.TOO_FAR_IN_SYSTEM;
        case 2:
            return LandMissionState.LANDED;
        default:
            return state;
    }
}

export const MissionTerminatorLandingNodeSerializedSchema = z.object({
    type: z.literal(MissionNodeType.TERMINATOR_LANDING),
    objectId: UniverseObjectIdSchema,
    state: z.preprocess((val) => preprocessLegacyLandMissionState(val), z.enum(LandMissionState)),
});

export type MissionTerminatorLandingNodeSerialized = z.infer<typeof MissionTerminatorLandingNodeSerializedSchema>;
