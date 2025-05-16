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

import { MissionAsteroidFieldNodeSerialized } from "@/backend/missions/missionAsteroidFieldNodeSerialized";
import { MissionFlyByNodeSerialized } from "@/backend/missions/missionFlyByNodeSerialized";
import {
    MissionAndNodeSerialized,
    MissionNodeSerialized,
    MissionOrNodeSerialized,
    MissionSequenceNodeSerialized,
    MissionXorNodeSerialized,
} from "@/backend/missions/missionNodeSerialized";
import { MissionNodeType } from "@/backend/missions/missionNodeType";
import { MissionTerminatorLandingNodeSerialized } from "@/backend/missions/missionTerminatorLandingNodeSerialized";
import { StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { MissionAsteroidFieldNode } from "./actions/sightseeing/missionAsteroidFieldNode";
import { MissionFlyByNode } from "./actions/sightseeing/missionFlyByNode";
import { MissionTerminatorLandingNode } from "./actions/sightseeing/missionTerminatorLandingNode";
import { MissionAndNode } from "./logic/missionAndNode";
import { MissionOrNode } from "./logic/missionOrNode";
import { MissionSequenceNode } from "./logic/missionSequenceNode";
import { MissionXorNode } from "./logic/missionXorNode";
import { MissionNode } from "./missionNode";

/**
 * Deserialize recursively a mission node.
 * @param missionNodeSerialized The serialized mission node.
 */
export function deserializeMissionNode(
    missionNodeSerialized: MissionNodeSerialized,
    starSystemDatabase: StarSystemDatabase,
): MissionNode | null {
    switch (missionNodeSerialized.type) {
        case MissionNodeType.AND:
            return deserializeMissionAndNode(missionNodeSerialized, starSystemDatabase);
        case MissionNodeType.OR:
            return deserializeMissionOrNode(missionNodeSerialized, starSystemDatabase);
        case MissionNodeType.XOR:
            return deserializeMissionXorNode(missionNodeSerialized, starSystemDatabase);
        case MissionNodeType.SEQUENCE:
            return deserializeMissionSequenceNode(missionNodeSerialized, starSystemDatabase);
        case MissionNodeType.ASTEROID_FIELD:
            return deserializeMissionAsteroidFieldNode(missionNodeSerialized, starSystemDatabase);
        case MissionNodeType.FLY_BY:
            return deserializeMissionFlyByNode(missionNodeSerialized);
        case MissionNodeType.TERMINATOR_LANDING:
            return deserializeMissionTerminatorLandingNode(missionNodeSerialized);
    }
}

function deserializeMissionAndNode(
    serialized: MissionAndNodeSerialized,
    starSystemDatabase: StarSystemDatabase,
): MissionAndNode {
    return new MissionAndNode(
        serialized.children
            .map((child) => deserializeMissionNode(child, starSystemDatabase))
            .filter((child) => child !== null),
    );
}

function deserializeMissionOrNode(
    serialized: MissionOrNodeSerialized,
    starSystemDatabase: StarSystemDatabase,
): MissionOrNode {
    return new MissionOrNode(
        serialized.children
            .map((child) => deserializeMissionNode(child, starSystemDatabase))
            .filter((child) => child !== null),
    );
}

function deserializeMissionXorNode(
    serialized: MissionXorNodeSerialized,
    starSystemDatabase: StarSystemDatabase,
): MissionXorNode {
    return new MissionXorNode(
        serialized.children
            .map((child) => deserializeMissionNode(child, starSystemDatabase))
            .filter((child) => child !== null),
    );
}

function deserializeMissionSequenceNode(
    serialized: MissionSequenceNodeSerialized,
    starSystemDatabase: StarSystemDatabase,
): MissionSequenceNode {
    const missionNode = new MissionSequenceNode(
        serialized.children
            .map((child) => deserializeMissionNode(child, starSystemDatabase))
            .filter((child) => child !== null),
    );
    missionNode.setActiveChildIndex(serialized.activeChildIndex);
    return missionNode;
}

function deserializeMissionAsteroidFieldNode(
    serialized: MissionAsteroidFieldNodeSerialized,
    starSystemDatabase: StarSystemDatabase,
): MissionAsteroidFieldNode | null {
    const missionNode = MissionAsteroidFieldNode.New(serialized.objectId, starSystemDatabase);
    missionNode?.setState(serialized.state);
    return missionNode;
}

function deserializeMissionFlyByNode(serialized: MissionFlyByNodeSerialized): MissionFlyByNode {
    const missionNode = new MissionFlyByNode(serialized.objectId);
    missionNode.setState(serialized.state);
    return missionNode;
}

function deserializeMissionTerminatorLandingNode(
    serialized: MissionTerminatorLandingNodeSerialized,
): MissionTerminatorLandingNode {
    const missionNode = new MissionTerminatorLandingNode(serialized.objectId);
    missionNode.setState(serialized.state);
    return missionNode;
}
