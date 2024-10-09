import { MissionContext } from "../missionContext";
import { SystemSeed } from "../../utils/systemSeed";

export interface MissionNode {
    isCompleted(): boolean;

    updateState(context: MissionContext): void;

    describeNextTask(context: MissionContext): Promise<string>;

    getTargetSystems(): SystemSeed[];

    serialize(): MissionNodeSerialized;
}

export const enum MissionNodeType {
    FLY_BY,
    TERMINATOR_LANDING,
    ASTEROID_FIELD,
    AND,
    OR,
    XOR,
    SEQUENCE
}

export type MissionNodeSerialized = {
    type: MissionNodeType;
    children: MissionNodeSerialized[];
};
