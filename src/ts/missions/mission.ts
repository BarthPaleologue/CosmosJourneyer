import { MissionNode, MissionNodeSerialized } from "./nodes/missionNode";
import { MissionContext } from "./missionContext";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { SystemSeed } from "../utils/systemSeed";
import { getUniverseIdForSpaceStationModel } from "../utils/orbitalObjectId";
import i18n from "../i18n";
import { UniverseObjectId } from "../saveFile/universeCoordinates";
import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";

export const enum MissionType {
    SIGHT_SEEING_FLY_BY,
    SIGHT_SEEING_TERMINATOR_LANDING,
    SIGHT_SEEING_ASTEROID_FIELD
}

export type MissionSerialized = {
    missionGiver: UniverseObjectId;
    type: MissionType;
    tree: MissionNodeSerialized;
    reward: number;
};

export class Mission implements Mission {
    private readonly tree: MissionNode;

    private readonly reward: number;

    private readonly missionGiver: SpaceStationModel;

    private readonly missionType: MissionType;

    constructor(tree: MissionNode, reward: number, missionGiver: SpaceStationModel, missionType: MissionType) {
        this.tree = tree;
        this.reward = reward;
        this.missionGiver = missionGiver;
        this.missionType = missionType;
    }

    async describeNextTask(context: MissionContext): Promise<string> {
        return await this.tree.describeNextTask(context);
    }

    equals(other: Mission): boolean {
        return false;
    }

    getMissionGiver(): SpaceStationModel {
        return this.missionGiver;
    }

    getReward(): number {
        return this.reward;
    }

    getTargetSystems(): SystemSeed[] {
        return this.tree.getTargetSystems();
    }

    getTypeString(): string {
        switch (this.missionType) {
            case MissionType.SIGHT_SEEING_FLY_BY:
                return i18n.t("missions:sightseeing:flyBy");
            case MissionType.SIGHT_SEEING_TERMINATOR_LANDING:
                return i18n.t("missions:sightseeing:terminatorLanding");
            case MissionType.SIGHT_SEEING_ASTEROID_FIELD:
                return i18n.t("missions:sightseeing:asteroidFieldTrek");
            default:
                throw new Error(`Unknown sight seeing type: ${this.missionType}`);
        }
    }

    describe(): string {
        const originSystem = this.missionGiver.starSystem;
        if(!(originSystem instanceof SeededStarSystemModel)) {
            throw new Error("Mission giver is not in a seeded star system");
        }
        const originSeed = originSystem.seed;

        return this.tree.describe(originSeed);
    }

    isCompleted(): boolean {
        return this.tree.isCompleted();
    }

    serialize(): MissionSerialized {
        return {
            missionGiver: getUniverseIdForSpaceStationModel(this.missionGiver),
            tree: this.tree.serialize(),
            reward: this.reward,
            type: this.missionType
        };
    }

    update(context: MissionContext): void {
        if (this.isCompleted()) return;
        this.tree.updateState(context);
    }
}
