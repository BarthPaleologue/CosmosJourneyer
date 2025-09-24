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
import { MissionNodeType } from "./missionNodeType";
import {
    MissionTerminatorLandingNodeSerializedSchema,
    type MissionTerminatorLandingNodeSerialized,
} from "./missionTerminatorLandingNodeSerialized";

export type MissionNodeSerializedShape =
    | MissionFlyByNodeSerialized
    | MissionTerminatorLandingNodeSerialized
    | MissionAsteroidFieldNodeSerialized
    | {
          type: MissionNodeType.AND;
          children: MissionNodeSerializedShape[];
      }
    | {
          type: MissionNodeType.OR;
          children: MissionNodeSerializedShape[];
      }
    | {
          type: MissionNodeType.XOR;
          children: MissionNodeSerializedShape[];
      }
    | {
          type: MissionNodeType.SEQUENCE;
          activeChildIndex: number;
          children: MissionNodeSerializedShape[];
      };

export const MissionOrNodeSerializedSchema = z.object({
    type: z.literal(MissionNodeType.OR),
    children: z.lazy(() => z.array(MissionNodeSerializedSchema)),
});

export const MissionAndNodeSerializedSchema = z.object({
    type: z.literal(MissionNodeType.AND),
    children: z.lazy(() => z.array(MissionNodeSerializedSchema)),
});

export const MissionXorNodeSerializedSchema = z.object({
    type: z.literal(MissionNodeType.XOR),
    children: z.lazy(() => z.array(MissionNodeSerializedSchema)),
});

export const MissionSequenceNodeSerializedSchema = z.object({
    type: z.literal(MissionNodeType.SEQUENCE),
    activeChildIndex: z.number(),
    children: z.lazy(() => z.array(MissionNodeSerializedSchema)),
});

export const MissionNodeSerializedSchema: z.ZodType<MissionNodeSerializedShape> = z.discriminatedUnion("type", [
    MissionFlyByNodeSerializedSchema,
    MissionTerminatorLandingNodeSerializedSchema,
    MissionAsteroidFieldNodeSerializedSchema,
    MissionAndNodeSerializedSchema,
    MissionOrNodeSerializedSchema,
    MissionXorNodeSerializedSchema,
    MissionSequenceNodeSerializedSchema,
]);

export type MissionNodeSerialized = z.infer<typeof MissionNodeSerializedSchema>;
export type MissionAndNodeSerialized = z.infer<typeof MissionAndNodeSerializedSchema>;
export type MissionOrNodeSerialized = z.infer<typeof MissionOrNodeSerializedSchema>;
export type MissionXorNodeSerialized = z.infer<typeof MissionXorNodeSerializedSchema>;
export type MissionSequenceNodeSerialized = z.infer<typeof MissionSequenceNodeSerializedSchema>;
