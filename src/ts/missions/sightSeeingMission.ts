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
import { Settings } from "../settings";
import { parseDistance } from "../utils/parseToStrings";
import { getObjectModelByUniverseId } from "../utils/orbitalObjectId";
import i18n from "../i18n";

export const enum SightSeeingType {
    FLY_BY,
    TERMINATOR_LANDING,
    ASTEROID_FIELD_TREK
}

function sightSeeingTypeToMissionType(type: SightSeeingType) {
    switch (type) {
        case SightSeeingType.FLY_BY:
            return MissionType.SIGHT_SEEING_FLY_BY;
        case SightSeeingType.TERMINATOR_LANDING:
            return MissionType.SIGHT_SEEING_TERMINATOR_LANDING;
        case SightSeeingType.ASTEROID_FIELD_TREK:
            return MissionType.SIGHT_SEEING_ASTEROID_FIELD;
    }
}

export type SightSeeingTarget = {
    type: SightSeeingType;
    objectId: UniverseObjectId;
};

function generateMissionTree(target: SightSeeingTarget): MissionNode {
    switch (target.type) {
        case SightSeeingType.FLY_BY:
            return new MissionFlyByNode(target.objectId);
        case SightSeeingType.TERMINATOR_LANDING:
            return new MissionTerminatorLandingNode(target.objectId);
        case SightSeeingType.ASTEROID_FIELD_TREK:
            return new MissionAsteroidFieldNode(target.objectId);
        default:
            throw new Error(`Unknown sight seeing type: ${target.type}`);
    }
}

function getDescribeString(originSeed: SystemSeed, target: SightSeeingTarget): string {
    const missionGiverGalacticCoordinates = getStarGalacticCoordinates(originSeed);
    const systemSeed = SystemSeed.Deserialize(target.objectId.starSystem);
    const systemGalacticPosition = getStarGalacticCoordinates(systemSeed);
    const distance = Vector3.Distance(missionGiverGalacticCoordinates, systemGalacticPosition);
    const systemModel = new SeededStarSystemModel(systemSeed);

    const targetModel = getObjectModelByUniverseId(target.objectId);
    const targetModelTypeString = targetModel.typeName.toLowerCase();
    const targetModelNameString = targetModel.name;

    let describeString: string;
    switch (target.type) {
        case SightSeeingType.FLY_BY:
            describeString = i18n.t("missions:sightseeing:describeFlyBy", {
                objectType: targetModelTypeString,
                systemName: systemModel.name
            });
            break;
        case SightSeeingType.TERMINATOR_LANDING:
            describeString = i18n.t("missions:sightseeing:describeTerminatorLanding", {
                objectName: targetModelNameString,
                systemName: systemModel.name
            });
            break;
        case SightSeeingType.ASTEROID_FIELD_TREK:
            describeString = i18n.t("missions:sightseeing:describeAsteroidFieldTrek", {
                objectName: targetModelNameString,
                systemName: systemModel.name
            });
            break;
        default:
            throw new Error(`Unknown sight seeing type: ${target.type}`);
    }

    let resultString = `${describeString}`;
    if (distance > 0) {
        resultString += ` (${parseDistance(distance * Settings.LIGHT_YEAR)})`;
    } else {
        resultString += ` (${i18n.t("missions:common:here")})`;
    }

    return resultString;
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

    return new Mission(missionTree, reward, missionGiver, sightSeeingTypeToMissionType(target.type));
}