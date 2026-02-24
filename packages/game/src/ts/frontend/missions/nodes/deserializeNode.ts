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

import { type MissionAsteroidFieldNodeSerialized } from "@/backend/missions/missionAsteroidFieldNodeSerialized";
import { type MissionFlyByNodeSerialized } from "@/backend/missions/missionFlyByNodeSerialized";
import {
    type MissionAndNodeSerialized,
    type MissionNodeSerialized,
    type MissionOrNodeSerialized,
    type MissionSequenceNodeSerialized,
    type MissionXorNodeSerialized,
} from "@/backend/missions/missionNodeSerialized";
import { type MissionTerminatorLandingNodeSerialized } from "@/backend/missions/missionTerminatorLandingNodeSerialized";
import { type UniverseBackend } from "@/backend/universe/universeBackend";

import { assertUnreachable, type DeepReadonly } from "@/utils/types";

import { MissionAsteroidFieldNode } from "./actions/sightseeing/missionAsteroidFieldNode";
import { MissionFlyByNode } from "./actions/sightseeing/missionFlyByNode";
import { MissionTerminatorLandingNode } from "./actions/sightseeing/missionTerminatorLandingNode";
import { MissionAndNode } from "./logic/missionAndNode";
import { MissionOrNode } from "./logic/missionOrNode";
import { MissionSequenceNode } from "./logic/missionSequenceNode";
import { MissionXorNode } from "./logic/missionXorNode";
import { type MissionNode } from "./missionNode";

/**
 * Deserialize recursively a mission node.
 * @param missionNodeSerialized The serialized mission node.
 */
export function deserializeMissionNode(
    missionNodeSerialized: DeepReadonly<MissionNodeSerialized>,
    universeBackend: UniverseBackend,
): MissionNode | null {
    const missionType = missionNodeSerialized.type;
    switch (missionType) {
        case "and":
            return deserializeMissionAndNode(missionNodeSerialized, universeBackend);
        case "or":
            return deserializeMissionOrNode(missionNodeSerialized, universeBackend);
        case "xor":
            return deserializeMissionXorNode(missionNodeSerialized, universeBackend);
        case "sequence":
            return deserializeMissionSequenceNode(missionNodeSerialized, universeBackend);
        case "asteroid_field":
            return deserializeMissionAsteroidFieldNode(missionNodeSerialized, universeBackend);
        case "fly_by":
            return deserializeMissionFlyByNode(missionNodeSerialized);
        case "terminator_landing":
            return deserializeMissionTerminatorLandingNode(missionNodeSerialized);
        default:
            return assertUnreachable(missionType);
    }
}

function deserializeMissionAndNode(
    serialized: DeepReadonly<MissionAndNodeSerialized>,
    universeBackend: UniverseBackend,
): MissionAndNode {
    return new MissionAndNode(
        serialized.children
            .map((child) => deserializeMissionNode(child, universeBackend))
            .filter((child) => child !== null),
    );
}

function deserializeMissionOrNode(
    serialized: DeepReadonly<MissionOrNodeSerialized>,
    universeBackend: UniverseBackend,
): MissionOrNode {
    return new MissionOrNode(
        serialized.children
            .map((child) => deserializeMissionNode(child, universeBackend))
            .filter((child) => child !== null),
    );
}

function deserializeMissionXorNode(
    serialized: DeepReadonly<MissionXorNodeSerialized>,
    universeBackend: UniverseBackend,
): MissionXorNode {
    return new MissionXorNode(
        serialized.children
            .map((child) => deserializeMissionNode(child, universeBackend))
            .filter((child) => child !== null),
    );
}

function deserializeMissionSequenceNode(
    serialized: DeepReadonly<MissionSequenceNodeSerialized>,
    universeBackend: UniverseBackend,
): MissionSequenceNode {
    const missionNode = new MissionSequenceNode(
        serialized.children
            .map((child) => deserializeMissionNode(child, universeBackend))
            .filter((child) => child !== null),
    );
    missionNode.setActiveChildIndex(serialized.activeChildIndex);
    return missionNode;
}

function deserializeMissionAsteroidFieldNode(
    serialized: DeepReadonly<MissionAsteroidFieldNodeSerialized>,
    universeBackend: UniverseBackend,
): MissionAsteroidFieldNode | null {
    const missionNode = MissionAsteroidFieldNode.New(serialized.objectId, universeBackend);
    missionNode?.setState(serialized.state);
    return missionNode;
}

function deserializeMissionFlyByNode(serialized: DeepReadonly<MissionFlyByNodeSerialized>): MissionFlyByNode {
    const missionNode = new MissionFlyByNode(serialized.objectId);
    missionNode.setState(serialized.state);
    return missionNode;
}

function deserializeMissionTerminatorLandingNode(
    serialized: DeepReadonly<MissionTerminatorLandingNodeSerialized>,
): MissionTerminatorLandingNode {
    const missionNode = new MissionTerminatorLandingNode(serialized.objectId);
    missionNode.setState(serialized.state);
    return missionNode;
}
