import { MissionNode, MissionNodeSerialized, MissionNodeType } from "../missionNode";
import { MissionContext } from "../../missionContext";

import { StarSystemCoordinates } from "../../../saveFile/universeCoordinates";

export type MissionSequenceNodeSerialized = MissionNodeSerialized & {
    activeChildIndex: number;
};

/**
 * Node used to describe a sequence of tasks that must be completed in order.
 */
export class MissionSequenceNode implements MissionNode {
    public children: MissionNode[];

    private hasCompletedLock = false;

    private activeChildIndex = 0;

    constructor(children: MissionNode[]) {
        this.children = children;
    }

    isCompleted(): boolean {
        return this.hasCompletedLock;
    }

    equals(other: MissionNode): boolean {
        if (!(other instanceof MissionSequenceNode)) return false;
        if (this.children.length !== other.children.length) return false;
        for (let i = 0; i < this.children.length; i++) {
            if (!this.children[i].equals(other.children[i])) return false;
        }
        return true;
    }

    updateState(context: MissionContext) {
        if (this.hasCompletedLock) return;
        if (this.activeChildIndex >= this.children.length) return;
        const child = this.children[this.activeChildIndex];
        child.updateState(context);
        if (child.isCompleted()) {
            this.activeChildIndex++;
        }

        this.hasCompletedLock = this.children.every((child) => child.isCompleted());
    }

    /**
     * Set the active child index. Useful when deserializing an ongoing mission.
     * @param index The index of the child to set as active.
     */
    setActiveChildIndex(index: number) {
        if (index < 0 || index >= this.children.length) {
            throw new Error(`Invalid index ${index} for mission sequence node. Must be between 0 and ${this.children.length - 1}`);
        }
        this.activeChildIndex = index;
    }

    describe(originSystemCoordinates: StarSystemCoordinates): string {
        return this.children.map((child) => child.describe(originSystemCoordinates)).join(" then ");
    }

    describeNextTask(context: MissionContext): Promise<string> {
        if (this.hasCompletedLock) return Promise.resolve("Mission completed");
        if (this.activeChildIndex >= this.children.length) return Promise.resolve("Mission completed");
        return this.children[this.activeChildIndex].describeNextTask(context);
    }

    getTargetSystems(): StarSystemCoordinates[] {
        return this.children[this.activeChildIndex].getTargetSystems();
    }

    serialize(): MissionSequenceNodeSerialized {
        return {
            type: MissionNodeType.SEQUENCE,
            children: this.children.map((child) => child.serialize()),
            activeChildIndex: this.activeChildIndex
        };
    }
}
