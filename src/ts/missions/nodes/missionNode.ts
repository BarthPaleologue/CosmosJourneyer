import { MissionContext } from "../missionContext";

export interface MissionNode {
    isCompleted(): boolean;

    updateState(context: MissionContext): void;

    describeNextTask(context: MissionContext): Promise<string>;

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
