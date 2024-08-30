import { Mission, MissionState } from "./mission";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { UniverseObjectId } from "../saveFile/universeCoordinates";
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

        this.reward = 100 * distanceLY * distanceLY;

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

    update(context: MissionContext): void {
        if (this.hasCompletedLock) return;
        const systemModel = context.currentSystem.model;
        if (systemModel instanceof SeededStarSystemModel) {
            // if the current system is none of the target systems, early return
            if (!this.targetSystem.equals(systemModel.seed)) return;
        }
        this.tree.updateState(context);
    }

    describe(): string {
        const missionGiverGalacticCoordinates = getStarGalacticCoordinates((this.missionGiver.starSystem as SeededStarSystemModel).seed);
        const systemSeed = SystemSeed.Deserialize(this.target.objectId.starSystem);
        const systemGalacticPosition = getStarGalacticCoordinates(systemSeed);
        const distance = Vector3.Distance(missionGiverGalacticCoordinates, systemGalacticPosition);
        const systemModel = new SeededStarSystemModel(systemSeed);

        let actionString: string;
        switch (this.target.type) {
            case SightSeeingType.FLY_BY:
                actionString = "Fly By of";
                break;
            case SightSeeingType.TERMINATOR_LANDING:
                actionString = "Landing at the terminator of";
                break;
            case SightSeeingType.ASTEROID_FIELD_TREK:
                actionString = "Trek in the asteroid field around";
                break;
            default:
                throw new Error(`Unknown sight seeing type: ${this.target.type}`);
        }

        return `${actionString} in ${systemModel.name} (${parseDistance(distance * Settings.LIGHT_YEAR)}`;
    }
}
