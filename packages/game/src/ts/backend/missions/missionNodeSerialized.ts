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

import {
    MissionAsteroidFieldNodeSerializedSchema,
    type MissionAsteroidFieldNodeSerialized,
} from "./missionAsteroidFieldNodeSerialized";
import { MissionFlyByNodeSerializedSchema, type MissionFlyByNodeSerialized } from "./missionFlyByNodeSerialized";
import {
    MissionTerminatorLandingNodeSerializedSchema,
    type MissionTerminatorLandingNodeSerialized,
} from "./missionTerminatorLandingNodeSerialized";

function preprocessLegacyMissionNodeType(type: unknown): unknown {
    if (typeof type !== "number") {
        return type;
    }

    switch (type) {
        case 0:
            return "fly_by";
        case 1:
            return "terminator_landing";
        case 2:
            return "asteroid_field";
        case 1000:
            return "and";
        case 1001:
            return "or";
        case 1002:
            return "xor";
        case 1003:
            return "sequence";
        default:
            return type;
    }
}

function preprocessLegacyMissionNode(node: unknown): unknown {
    if (typeof node !== "object" || node === null) {
        return node;
    }

    const candidate = node as Record<string, unknown>;
    const normalizedType = preprocessLegacyMissionNodeType(candidate["type"]);

    if (!Array.isArray(candidate["children"])) {
        if (normalizedType === candidate["type"]) {
            return node;
        }
        return {
            ...candidate,
            type: normalizedType,
        };
    }

    return {
        ...candidate,
        type: normalizedType,
        children: candidate["children"].map((child) => preprocessLegacyMissionNode(child)),
    };
}

export type MissionNodeSerializedShape =
    | MissionFlyByNodeSerialized
    | MissionTerminatorLandingNodeSerialized
    | MissionAsteroidFieldNodeSerialized
    | {
          type: "and";
          children: MissionNodeSerializedShape[];
      }
    | {
          type: "or";
          children: MissionNodeSerializedShape[];
      }
    | {
          type: "xor";
          children: MissionNodeSerializedShape[];
      }
    | {
          type: "sequence";
          activeChildIndex: number;
          children: MissionNodeSerializedShape[];
      };

export const MissionOrNodeSerializedSchema = z.object({
    type: z.literal("or"),
    children: z.lazy(() => z.array(MissionNodeSerializedSchema)),
});

export const MissionAndNodeSerializedSchema = z.object({
    type: z.literal("and"),
    children: z.lazy(() => z.array(MissionNodeSerializedSchema)),
});

export const MissionXorNodeSerializedSchema = z.object({
    type: z.literal("xor"),
    children: z.lazy(() => z.array(MissionNodeSerializedSchema)),
});

export const MissionSequenceNodeSerializedSchema = z.object({
    type: z.literal("sequence"),
    activeChildIndex: z.number(),
    children: z.lazy(() => z.array(MissionNodeSerializedSchema)),
});

export const MissionNodeSerializedSchema: z.ZodType<MissionNodeSerializedShape> = z.preprocess(
    (value) => preprocessLegacyMissionNode(value),
    z.discriminatedUnion("type", [
        MissionFlyByNodeSerializedSchema,
        MissionTerminatorLandingNodeSerializedSchema,
        MissionAsteroidFieldNodeSerializedSchema,
        MissionAndNodeSerializedSchema,
        MissionOrNodeSerializedSchema,
        MissionXorNodeSerializedSchema,
        MissionSequenceNodeSerializedSchema,
    ]),
);

export type MissionNodeSerialized = z.infer<typeof MissionNodeSerializedSchema>;
export type MissionAndNodeSerialized = z.infer<typeof MissionAndNodeSerializedSchema>;
export type MissionOrNodeSerialized = z.infer<typeof MissionOrNodeSerializedSchema>;
export type MissionXorNodeSerialized = z.infer<typeof MissionXorNodeSerializedSchema>;
export type MissionSequenceNodeSerialized = z.infer<typeof MissionSequenceNodeSerializedSchema>;
