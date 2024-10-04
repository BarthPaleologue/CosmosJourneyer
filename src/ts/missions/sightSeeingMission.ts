import { Mission, MissionState } from "./mission";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { SystemObjectType, UniverseObjectId, universeObjectIdEquals } from "../saveFile/universeCoordinates";
import { SystemSeed } from "../utils/systemSeed";
import { getStarGalacticCoordinates } from "../utils/getStarGalacticCoordinates";
import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MissionNode } from "./nodes/missionNode";
import { MissionContext } from "./missionContext";
import { MissionSightSeeingFlyByNode } from "./nodes/actions/sightseeing/missionSightSeeingFlyByNode";
import { MissionSightSeeingLandNode } from "./nodes/actions/sightseeing/missionSightSeeingLandNode";
import { MissionSightSeeingAsteroidFieldNode } from "./nodes/actions/sightseeing/missionSightSeeingAsteroidFieldNode";
import { Settings } from "../settings";
import { parseDistance } from "../utils/parseToStrings";
import { getObjectModelByUniverseId } from "../utils/orbitalObjectId";
import i18n from "../i18n";

export const enum SightSeeingType {
    FLY_BY,
    TERMINATOR_LANDING,
    ASTEROID_FIELD_TREK
}

export type SightSeeingTarget = {
    type: SightSeeingType;
    objectId: UniverseObjectId;
};

export class SightSeeingMission implements Mission {
    private readonly missionGiver: SpaceStationModel;
    private readonly target: SightSeeingTarget;

    private readonly targetSystem: SystemSeed;

    private readonly reward: number;

    private hasCompletedLock = false;

    private tree: MissionNode;

    private state: MissionState = MissionState.UNKNOWN;

    constructor(missionGiver: SpaceStationModel, target: SightSeeingTarget) {
        this.missionGiver = missionGiver;
        this.target = target;

        this.targetSystem = SystemSeed.Deserialize(target.objectId.starSystem);

        const missionGiverGalacticCoordinates = getStarGalacticCoordinates((missionGiver.starSystem as SeededStarSystemModel).seed);

        const targetGalacticCoordinates = getStarGalacticCoordinates(this.targetSystem);
        const distanceLY = Vector3.Distance(missionGiverGalacticCoordinates, targetGalacticCoordinates);

        this.reward = Math.max(5_000, 1000 * Math.ceil(distanceLY));
        if (target.objectId.objectType === SystemObjectType.STELLAR_OBJECT) {
            this.reward *= 1.5;
        }

        this.tree = this.generateMissionTree();
    }

    private generateMissionTree(): MissionNode {
        switch (this.target.type) {
            case SightSeeingType.FLY_BY:
                return new MissionSightSeeingFlyByNode(this.target.objectId);
            case SightSeeingType.TERMINATOR_LANDING:
                return new MissionSightSeeingLandNode(this.target.objectId);
            case SightSeeingType.ASTEROID_FIELD_TREK:
                return new MissionSightSeeingAsteroidFieldNode(this.target.objectId);
            default:
                throw new Error(`Unknown sight seeing type: ${this.target.type}`);
        }
    }

    getTargetSystems(): SystemSeed[] {
        return [this.targetSystem];
    }

    getReward(): number {
        return this.reward;
    }

    getMissionGiver(): SpaceStationModel {
        return this.missionGiver;
    }

    isCompleted(): boolean {
        if (this.hasCompletedLock) return true;
        this.hasCompletedLock = this.tree.isCompleted();
        return this.hasCompletedLock;
    }

    setState(state: MissionState) {
        this.state = state;
    }

    getState(): MissionState {
        return MissionState.UNKNOWN;
    }

    equals(other: Mission): boolean {
        if (other instanceof SightSeeingMission) {
            return universeObjectIdEquals(this.target.objectId, other.target.objectId) && this.target.type === other.target.type;
        }
        return false;
    }

    update(context: MissionContext): void {
        if (this.isCompleted()) return;
        this.tree.updateState(context);
    }

    getTypeString(): string {
        switch (this.target.type) {
            case SightSeeingType.FLY_BY:
                return "Fly-By";
            case SightSeeingType.TERMINATOR_LANDING:
                return "Terminator Landing";
            case SightSeeingType.ASTEROID_FIELD_TREK:
                return "Asteroid Field Trek";
            default:
                throw new Error(`Unknown sight seeing type: ${this.target.type}`);
        }
    }

    describe(): string {
        const missionGiverGalacticCoordinates = getStarGalacticCoordinates((this.missionGiver.starSystem as SeededStarSystemModel).seed);
        const systemSeed = SystemSeed.Deserialize(this.target.objectId.starSystem);
        const systemGalacticPosition = getStarGalacticCoordinates(systemSeed);
        const distance = Vector3.Distance(missionGiverGalacticCoordinates, systemGalacticPosition);
        const systemModel = new SeededStarSystemModel(systemSeed);

        const targetModel = getObjectModelByUniverseId(this.target.objectId);
        const targetModelTypeString = targetModel.typeName.toLowerCase();
        const targetModelNameString = targetModel.name;

        let describeString: string;
        switch (this.target.type) {
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
                throw new Error(`Unknown sight seeing type: ${this.target.type}`);
        }

        let resultString = `${describeString}`;
        if (distance > 0) {
            resultString += ` (${parseDistance(distance * Settings.LIGHT_YEAR)})`;
        } else {
            resultString += ` (${i18n.t("missions:common:here")})`;
        }

        return resultString;
    }

    describeNextTask(context: MissionContext): string {
        return this.tree.describeNextTask(context);
    }
}
