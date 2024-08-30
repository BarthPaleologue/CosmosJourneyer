import { Mission, MissionState } from "./mission";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { UniverseObjectId } from "../saveFile/universeCoordinates";
import { SystemSeed } from "../utils/systemSeed";
import { getStarGalacticCoordinates } from "../utils/getStarGalacticCoordinates";
import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MissionNode } from "./nodes/missionNode";
import { MissionAndNode } from "./nodes/logic/missionAndNode";
import { MissionContext } from "./missionContext";
import { MissionSightSeeingFlyByNode } from "./nodes/actions/sightseeing/missionSightSeeingFlyByNode";
import { MissionSightSeeingLandNode } from "./nodes/actions/sightseeing/missionSightSeeingLandNode";
import { MissionSightSeeingAsteroidFieldNode } from "./nodes/actions/sightseeing/missionSightSeeingAsteroidFieldNode";

export const enum SightSeeingType {
    FLY_BY,
    LAND,
    ASTEROID_FIELD
}

export type SightSeeingTarget = {
    type: SightSeeingType;
    objectId: UniverseObjectId;
};

export class SightSeeingMission implements Mission {
    private readonly missionGiver: SpaceStationModel;
    private readonly targets: SightSeeingTarget[];

    private readonly targetSystems: SystemSeed[];

    private reward: number;

    private hasCompletedLock = false;

    private tree: MissionNode;

    private state: MissionState = MissionState.UNKNOWN;

    constructor(missionGiver: SpaceStationModel, targets: SightSeeingTarget[]) {
        this.missionGiver = missionGiver;
        this.targets = targets;

        this.targetSystems = targets.map(
            (target) =>
                new SystemSeed(
                    target.objectId.starSystem.starSectorX,
                    target.objectId.starSystem.starSectorY,
                    target.objectId.starSystem.starSectorZ,
                    target.objectId.starSystem.index
                )
        );
        // filter out duplicates using custom equals method
        this.targetSystems = this.targetSystems.filter((system, index, self) => self.findIndex((other) => system.equals(other)) === index);

        const missionGiverGalacticCoordinates = getStarGalacticCoordinates((missionGiver.starSystem as SeededStarSystemModel).seed);

        this.reward = 0;
        this.targetSystems.forEach((target) => {
            const targetGalacticCoordinates = getStarGalacticCoordinates(target);
            const distanceLY = Vector3.Distance(missionGiverGalacticCoordinates, targetGalacticCoordinates);

            this.reward += 100 * distanceLY * distanceLY;
        });

        this.tree = this.generateMissionTree();
    }

    private generateMissionTree(): MissionNode {
        return new MissionAndNode(
            this.targets.map((target) => {
                switch (target.type) {
                    case SightSeeingType.FLY_BY:
                        return new MissionSightSeeingFlyByNode(target.objectId);
                    case SightSeeingType.LAND:
                        return new MissionSightSeeingLandNode(target.objectId);
                    case SightSeeingType.ASTEROID_FIELD:
                        return new MissionSightSeeingAsteroidFieldNode(target.objectId);
                    default:
                        throw new Error(`Unknown sight seeing type: ${target.type}`);
                }
            })
        );
    }

    getTargetSystems(): SystemSeed[] {
        return this.targetSystems;
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
            if (this.targetSystems.every((target) => !target.equals(systemModel.seed))) return;
        }
        this.tree.updateState(context);
    }
}
