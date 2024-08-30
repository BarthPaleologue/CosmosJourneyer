import { MissionContext } from "../missionContext";

export interface MissionNode {
    isCompleted(): boolean;
    updateState(context: MissionContext): void;
}
