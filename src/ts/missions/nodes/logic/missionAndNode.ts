import { MissionNode } from "../missionNode";
import { MissionContext } from "../../missionContext";

export class MissionAndNode implements MissionNode {
    public children: MissionNode[];

    private hasCompletedLock = false;

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
        this.children.forEach((child) => child.updateState(context));
    }

    describeNextTask(context: MissionContext): string {
        if (this.hasCompletedLock) return "Mission completed";
        return this.children.map((child) => child.describeNextTask(context)).join(" and ");
    }
}
