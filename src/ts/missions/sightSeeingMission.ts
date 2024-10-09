import { Mission, MissionType } from "./mission";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { SystemObjectType, UniverseObjectId } from "../saveFile/universeCoordinates";
import { SystemSeed } from "../utils/systemSeed";
import { getStarGalacticCoordinates } from "../utils/getStarGalacticCoordinates";
import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MissionNode } from "./nodes/missionNode";
import { MissionFlyByNode } from "./nodes/actions/sightseeing/missionFlyByNode";
import { MissionTerminatorLandingNode } from "./nodes/actions/sightseeing/missionTerminatorLandingNode";
import { MissionAsteroidFieldNode } from "./nodes/actions/sightseeing/missionAsteroidFieldNode";

export type SightSeeingType = MissionType.SIGHT_SEEING_FLY_BY | MissionType.SIGHT_SEEING_TERMINATOR_LANDING | MissionType.SIGHT_SEEING_ASTEROID_FIELD;

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

export function newSightSeeingMission(missionGiver: SpaceStationModel, target: SightSeeingTarget): Mission {
    const missionTree = generateMissionTree(target);

    const targetSystem = SystemSeed.Deserialize(target.objectId.starSystem);

    const missionGiverGalacticCoordinates = getStarGalacticCoordinates((missionGiver.starSystem as SeededStarSystemModel).seed);

    const targetGalacticCoordinates = getStarGalacticCoordinates(targetSystem);
    const distanceLY = Vector3.Distance(missionGiverGalacticCoordinates, targetGalacticCoordinates);

    let reward = Math.max(5_000, 1000 * Math.ceil(distanceLY));
    if (target.objectId.objectType === SystemObjectType.STELLAR_OBJECT) {
        reward *= 1.5;
    }

    return new Mission(missionTree, reward, missionGiver, target.type);
}
