import { MissionNode } from "../missionNode";
import { MissionContext } from "../../missionContext";

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
}
