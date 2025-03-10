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

import { MissionAndNode, MissionAndNodeSerialized } from "./logic/missionAndNode";
import { MissionOrNode, MissionOrNodeSerialized } from "./logic/missionOrNode";
import {
    MissionAsteroidFieldNode,
    MissionAsteroidFieldNodeSerialized,
    MissionAsteroidFieldNodeSerializedSchema
} from "./actions/sightseeing/missionAsteroidFieldNode";
import {
    MissionFlyByNode,
    MissionFlyByNodeSerialized,
    MissionFlyByNodeSerializedSchema
} from "./actions/sightseeing/missionFlyByNode";
import {
    MissionTerminatorLandingNode,
    MissionTerminatorLandingNodeSerialized,
    MissionTerminatorLandingNodeSerializedSchema
} from "./actions/sightseeing/missionTerminatorLandingNode";
import { MissionXorNode, MissionXorNodeSerialized } from "./logic/missionXorNode";
import { MissionSequenceNode, MissionSequenceNodeSerialized } from "./logic/missionSequenceNode";
import { z } from "zod";
import { MissionNodeType } from "./missionNode";

export type MissionNodeSerialized =
    | MissionAndNodeSerialized
    | MissionOrNodeSerialized
    | MissionXorNodeSerialized
    | MissionSequenceNodeSerialized
    | MissionAsteroidFieldNodeSerialized
    | MissionFlyByNodeSerialized
    | MissionTerminatorLandingNodeSerialized;

export const MissionNodeSerializedSchema: z.ZodType<MissionNodeSerialized, z.ZodTypeDef, MissionNodeSerialized> =
    z.lazy(() =>
        z.discriminatedUnion("type", [
            MissionFlyByNodeSerializedSchema,
            MissionTerminatorLandingNodeSerializedSchema,
            MissionAsteroidFieldNodeSerializedSchema,
            MissionAndNodeSerializedSchema,
            MissionOrNodeSerializedSchema,
            MissionXorNodeSerializedSchema,
            MissionSequenceNodeSerializedSchema
        ])
    );

export const MissionOrNodeSerializedSchema = z.object({
    type: z.literal(MissionNodeType.OR),
    children: z.array(MissionNodeSerializedSchema)
});

export const MissionAndNodeSerializedSchema = z.object({
    type: z.literal(MissionNodeType.AND),
    children: z.array(MissionNodeSerializedSchema)
});

export const MissionXorNodeSerializedSchema = z.object({
    type: z.literal(MissionNodeType.XOR),
    children: z.array(MissionNodeSerializedSchema)
});

export const MissionSequenceNodeSerializedSchema = z.object({
    type: z.literal(MissionNodeType.SEQUENCE),
    activeChildIndex: z.number(),
    children: z.array(MissionNodeSerializedSchema)
});

export type MissionNode =
    | MissionAndNode
    | MissionOrNode
    | MissionXorNode
    | MissionSequenceNode
    | MissionAsteroidFieldNode
    | MissionFlyByNode
    | MissionTerminatorLandingNode;

/**
 * Deserialize recursively a mission node.
 * @param missionNodeSerialized The serialized mission node.
 */
export function deserializeMissionNode(missionNodeSerialized: MissionNodeSerialized): MissionNode {
    switch (missionNodeSerialized.type) {
        case MissionNodeType.AND:
            return deserializeMissionAndNode(missionNodeSerialized);
        case MissionNodeType.OR:
            return deserializeMissionOrNode(missionNodeSerialized);
        case MissionNodeType.XOR:
            return deserializeMissionXorNode(missionNodeSerialized);
        case MissionNodeType.SEQUENCE:
            return deserializeMissionSequenceNode(missionNodeSerialized);
        case MissionNodeType.ASTEROID_FIELD:
            return deserializeMissionAsteroidFieldNode(missionNodeSerialized);
        case MissionNodeType.FLY_BY:
            return deserializeMissionFlyByNode(missionNodeSerialized);
        case MissionNodeType.TERMINATOR_LANDING:
            return deserializeMissionTerminatorLandingNode(missionNodeSerialized);
    }
}

function deserializeMissionAndNode(serialized: MissionAndNodeSerialized): MissionAndNode {
    return new MissionAndNode(serialized.children.map((child) => deserializeMissionNode(child)));
}

function deserializeMissionOrNode(serialized: MissionOrNodeSerialized): MissionOrNode {
    return new MissionOrNode(serialized.children.map((child) => deserializeMissionNode(child)));
}

function deserializeMissionXorNode(serialized: MissionXorNodeSerialized): MissionXorNode {
    return new MissionXorNode(serialized.children.map((child) => deserializeMissionNode(child)));
}

function deserializeMissionSequenceNode(serialized: MissionSequenceNodeSerialized): MissionSequenceNode {
    const missionNode = new MissionSequenceNode(serialized.children.map((child) => deserializeMissionNode(child)));
    missionNode.setActiveChildIndex(serialized.activeChildIndex);
    return missionNode;
}

function deserializeMissionAsteroidFieldNode(serialized: MissionAsteroidFieldNodeSerialized): MissionAsteroidFieldNode {
    const missionNode = new MissionAsteroidFieldNode(serialized.objectId);
    missionNode.setState(serialized.state);
    return missionNode;
}

function deserializeMissionFlyByNode(serialized: MissionFlyByNodeSerialized): MissionFlyByNode {
    const missionNode = new MissionFlyByNode(serialized.objectId);
    missionNode.setState(serialized.state);
    return missionNode;
}

function deserializeMissionTerminatorLandingNode(
    serialized: MissionTerminatorLandingNodeSerialized
): MissionTerminatorLandingNode {
    const missionNode = new MissionTerminatorLandingNode(serialized.objectId);
    missionNode.setState(serialized.state);
    return missionNode;
}
