import { MissionNode, MissionNodeSerialized, MissionNodeType } from "./missionNode";
import { MissionAndNode, MissionAndNodeSerialized } from "./logic/missionAndNode";
import { MissionOrNode, MissionOrNodeSerialized } from "./logic/missionOrNode";
import { MissionAsteroidFieldNode, MissionAsteroidFieldNodeSerialized } from "./actions/sightseeing/missionAsteroidFieldNode";
import { MissionFlyByNode, MissionFlyByNodeSerialized } from "./actions/sightseeing/missionFlyByNode";
import { MissionTerminatorLandingNode, MissionTerminatorLandingNodeSerialized } from "./actions/sightseeing/missionTerminatorLandingNode";
import { MissionXorNode, MissionXorNodeSerialized } from "./logic/missionXorNode";
import { MissionSequenceNode, MissionSequenceNodeSerialized } from "./logic/missionSequenceNode";

/**
 * Deserialize recursively a mission node.
 * @param missionNodeSerialized The serialized mission node.
 */
export function deserializeMissionNode(missionNodeSerialized: MissionNodeSerialized): MissionNode {
    switch (missionNodeSerialized.type) {
        case MissionNodeType.AND:
            return deserializeMissionAndNode(missionNodeSerialized as MissionAndNodeSerialized);
        case MissionNodeType.OR:
            return deserializeMissionOrNode(missionNodeSerialized as MissionOrNodeSerialized);
        case MissionNodeType.XOR:
            return deserializeMissionXorNode(missionNodeSerialized as MissionXorNodeSerialized);
        case MissionNodeType.SEQUENCE:
            return deserializeMissionSequenceNode(missionNodeSerialized as MissionSequenceNodeSerialized);
        case MissionNodeType.ASTEROID_FIELD:
            return deserializeMissionAsteroidFieldNode(missionNodeSerialized as MissionAsteroidFieldNodeSerialized);
        case MissionNodeType.FLY_BY:
            return deserializeMissionFlyByNode(missionNodeSerialized as MissionFlyByNodeSerialized);
        case MissionNodeType.TERMINATOR_LANDING:
            return deserializeMissionTerminatorLandingNode(missionNodeSerialized as MissionTerminatorLandingNodeSerialized);
        default:
            throw new Error(`Unknown mission node type: ${missionNodeSerialized.type}`);
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

function deserializeMissionTerminatorLandingNode(serialized: MissionTerminatorLandingNodeSerialized): MissionTerminatorLandingNode {
    const missionNode = new MissionTerminatorLandingNode(serialized.objectId);
    missionNode.setState(serialized.state);
    return missionNode;
}
