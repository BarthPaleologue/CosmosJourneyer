import { Mission, MissionType } from "./mission";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { SystemObjectType, UniverseObjectId } from "../saveFile/universeCoordinates";
import { getStarGalacticPosition } from "../utils/starSystemCoordinatesUtils";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MissionNode } from "./nodes/missionNode";
import { MissionFlyByNode } from "./nodes/actions/sightseeing/missionFlyByNode";
import { MissionTerminatorLandingNode } from "./nodes/actions/sightseeing/missionTerminatorLandingNode";
import { MissionAsteroidFieldNode } from "./nodes/actions/sightseeing/missionAsteroidFieldNode";

/**
 * Sightseeing mission types are a subset of mission types.
 */
export type SightSeeingType = MissionType.SIGHT_SEEING_FLY_BY | MissionType.SIGHT_SEEING_TERMINATOR_LANDING | MissionType.SIGHT_SEEING_ASTEROID_FIELD;

/**
 * Defines a target for a sightseeing mission and the type of sightseeing mission.
 */
export type SightSeeingTarget = {
    type: SightSeeingType;
    objectId: UniverseObjectId;
};

function generateMissionTree(target: SightSeeingTarget): MissionNode {
    switch (target.type) {
        case MissionType.SIGHT_SEEING_FLY_BY:
            return new MissionFlyByNode(target.objectId);
        case MissionType.SIGHT_SEEING_TERMINATOR_LANDING:
            return new MissionTerminatorLandingNode(target.objectId);
        case MissionType.SIGHT_SEEING_ASTEROID_FIELD:
            return new MissionAsteroidFieldNode(target.objectId);
        default:
            throw new Error(`Unknown sight seeing type: ${target.type}`);
    }
}

/**
 * Creates a new sightseeing mission from a mission giver to a target.
 * @param missionGiver The space station that gives the mission.
 * @param target The target of the sightseeing mission.
 * @returns The new sightseeing mission.
 */
export function newSightSeeingMission(missionGiver: SpaceStationModel, target: SightSeeingTarget): Mission {
    const missionTree = generateMissionTree(target);

    const targetSystemCoordinates = target.objectId.starSystemCoordinates;

    const missionGiverGalacticCoordinates = getStarGalacticPosition(missionGiver.starSystem.getCoordinates());

    const targetGalacticCoordinates = getStarGalacticPosition(targetSystemCoordinates);
    const distanceLY = Vector3.Distance(missionGiverGalacticCoordinates, targetGalacticCoordinates);

    // reward far away targets more
    let reward = Math.max(5_000, 1000 * Math.ceil(distanceLY));
    if (target.objectId.objectType === SystemObjectType.STELLAR_OBJECT) {
        // reward for stellar objects is higher to nudge the player towards them
        reward *= 1.5;
    }

    return new Mission(missionTree, reward, missionGiver, target.type);
}
