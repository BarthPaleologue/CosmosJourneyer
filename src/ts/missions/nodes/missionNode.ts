import { MissionContext } from "../missionContext";
import { SystemSeed } from "../../utils/systemSeed";

/**
 * Describes any node in the mission tree.
 */
export interface MissionNode {
    /**
     * Returns true if the node is completed, false otherwise.
     */
    isCompleted(): boolean;

    /**
     * Updates the state of the node recursively.
     * @param context The mission context.
     */
    updateState(context: MissionContext): void;

    /**
     * Returns true if the node is equal to another node, false otherwise.
     * @param other The other node to compare to.
     */
    equals(other: MissionNode): boolean;

    /**
     * Describes the node recursively.
     * @param originSeed The seed of the system where the mission has been given.
     */
    describe(originSeed: SystemSeed): string;

    /**
     * Describes the next task to be done in the mission subtree.
     * @param context The mission context.
     */
    describeNextTask(context: MissionContext): Promise<string>;

    /**
     * Returns the target systems of the subtree.
     */
    getTargetSystems(): SystemSeed[];

    /**
     * Serializes the node recursively.
     */
    serialize(): MissionNodeSerialized;
}

/**
 * Describes the type of mission node. Useful for serialization/deserialization.
 */
export const enum MissionNodeType {
    FLY_BY = 0,
    TERMINATOR_LANDING = 1,
    ASTEROID_FIELD = 2,
    AND = 1000,
    OR = 1001,
    XOR = 1002,
    SEQUENCE = 1003
}

/**
 * Base type for all serialized mission nodes.
 * Nodes should specialize this type with their relevant fields.
 */
export type MissionNodeSerialized = {
    type: MissionNodeType;
    children: MissionNodeSerialized[];
};
