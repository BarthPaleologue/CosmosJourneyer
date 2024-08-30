import { SpaceStationModel } from "../spacestation/spacestationModel";
import { SystemSeed } from "../utils/systemSeed";
import { MissionContext } from "./missionContext";

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

    describe(): string;
}
