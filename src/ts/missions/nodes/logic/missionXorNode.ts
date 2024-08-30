import { MissionNode } from "../missionNode";
import { MissionContext } from "../../missionContext";

export class MissionXorNode implements MissionNode {
    public children: MissionNode[];

    private hasCompletedLock = false;

    constructor(children: MissionNode[]) {
        this.children = children;
    }

    isCompleted(): boolean {
        if (this.hasCompletedLock) return true;
        this.hasCompletedLock = this.children.filter((child) => child.isCompleted()).length === 1;
        return this.hasCompletedLock;
    }

    updateState(context: MissionContext) {
        if (this.hasCompletedLock) return;
        this.children.forEach((child) => child.updateState(context));
    }
}