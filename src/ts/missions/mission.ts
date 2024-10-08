import { SpaceStationModel } from "../spacestation/spacestationModel";
import { SystemSeed } from "../utils/systemSeed";
import { MissionContext } from "./missionContext";
import { UniverseObjectId } from "../saveFile/universeCoordinates";
import { MissionNodeSerialized } from "./nodes/missionNode";

export const enum MissionState {
    UNKNOWN,
    AVAILABLE,
    ACCEPTED,
    ACTIVE,
    COMPLETED
}

export interface Mission {
    isCompleted(): boolean;

    getReward(): number;

    getMissionGiver(): SpaceStationModel;

    getTargetSystems(): SystemSeed[];

    setState(state: MissionState): void;

    getState(): MissionState;

    update(context: MissionContext): void;

    equals(other: Mission): boolean;

    getTypeString(): string;

    describe(): string;

    describeNextTask(context: MissionContext): Promise<string>;

    serialize(): MissionSerialized;
}

export const enum MissionType {
    SIGHT_SEEING,
}

export type MissionSerialized = {
    missionGiver: UniverseObjectId;
    type: MissionType;
    tree: MissionNodeSerialized;
}