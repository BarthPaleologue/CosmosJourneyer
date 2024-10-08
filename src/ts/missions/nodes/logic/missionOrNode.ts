import { MissionNode } from "../missionNode";
import { MissionContext } from "../../missionContext";
import i18n from "../../../i18n";

export class MissionOrNode implements MissionNode {
    public children: MissionNode[];

    private hasCompletedLock = false;

    constructor(children: MissionNode[]) {
        this.children = children;
    }

    isCompleted(): boolean {
        if (this.hasCompletedLock) return true;
        this.hasCompletedLock = this.children.some((child) => child.isCompleted());
        return this.hasCompletedLock;
    }

    updateState(context: MissionContext) {
        if (this.hasCompletedLock) return;
        this.children.forEach((child) => child.updateState(context));
    }

    describeNextTask(context: MissionContext): Promise<string> {
        if (this.hasCompletedLock) return Promise.resolve("Mission completed");
        return Promise.resolve(this.children.map((child) => child.describeNextTask(context)).join(` ${i18n.t("common:or")} `));
    }
}
