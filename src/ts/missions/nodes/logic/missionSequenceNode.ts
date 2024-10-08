import { MissionNode, MissionNodeSerialized, MissionNodeType } from "../missionNode";
import { MissionContext } from "../../missionContext";

export type MissionSequenceNodeSerialized = MissionNodeSerialized & {
    activeChildIndex: number;
}

export class MissionSequenceNode implements MissionNode {
    public children: MissionNode[];

    private hasCompletedLock = false;

    private activeChildIndex = 0;

    constructor(children: MissionNode[]) {
        this.children = children;
    }

    isCompleted(): boolean {
        if (this.hasCompletedLock) return true;
        this.hasCompletedLock = this.children.every((child) => child.isCompleted());
        return this.hasCompletedLock;
    }

    updateState(context: MissionContext) {
        if (this.hasCompletedLock) return;
        if (this.activeChildIndex >= this.children.length) return;
        const child = this.children[this.activeChildIndex];
        child.updateState(context);
        if (child.isCompleted()) {
            this.activeChildIndex++;
        }
    }

    setActiveChildIndex(index: number) {
        this.activeChildIndex = index;
    }

    describeNextTask(context: MissionContext): Promise<string> {
        if (this.hasCompletedLock) return Promise.resolve("Mission completed");
        if (this.activeChildIndex >= this.children.length) return Promise.resolve("Mission completed");
        return this.children[this.activeChildIndex].describeNextTask(context);
    }

    serialize(): MissionSequenceNodeSerialized {
        return {
            type: MissionNodeType.SEQUENCE,
            children: this.children.map((child) => child.serialize()),
            activeChildIndex: this.activeChildIndex,
        };
    }
}
