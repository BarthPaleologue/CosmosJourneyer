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
    MissionAsteroidFieldNodeSerialized
} from "./actions/sightseeing/missionAsteroidFieldNode";
import { MissionFlyByNode, MissionFlyByNodeSerialized } from "./actions/sightseeing/missionFlyByNode";
import {
    MissionTerminatorLandingNode,
    MissionTerminatorLandingNodeSerialized
} from "./actions/sightseeing/missionTerminatorLandingNode";
import { MissionXorNode, MissionXorNodeSerialized } from "./logic/missionXorNode";
import { MissionSequenceNode, MissionSequenceNodeSerialized } from "./logic/missionSequenceNode";
import { MissionNode, MissionNodeType } from "./missionNode";
import { MissionNodeSerialized } from "./missionNodeSerialized";

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
