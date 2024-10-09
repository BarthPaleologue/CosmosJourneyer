import { MissionNode, MissionNodeSerialized, MissionNodeType } from "../missionNode";
import { MissionContext } from "../../missionContext";
import { SystemSeed } from "../../../utils/systemSeed";
import i18n from "../../../i18n";

export type MissionAndNodeSerialized = MissionNodeSerialized;

export class MissionAndNode implements MissionNode {
    public children: MissionNode[];

    private hasCompletedLock = false;

    constructor(children: MissionNode[]) {
        this.children = children;
    }

    isCompleted(): boolean {
        return this.hasCompletedLock;
    }

    updateState(context: MissionContext) {
        if (this.hasCompletedLock) return;
        this.children.forEach((child) => child.updateState(context));
        this.hasCompletedLock = this.children.every((child) => child.isCompleted());
    }

    describe(originSeed: SystemSeed): string {
        return this.children.map((child) => child.describe(originSeed)).join(` ${i18n.t("common:and")} `);
    }

    describeNextTask(context: MissionContext): Promise<string> {
        if (this.hasCompletedLock) return Promise.resolve("Mission completed");
        return Promise.resolve(this.children.map((child) => child.describeNextTask(context)).join(` ${i18n.t("common:and")} `));
    }

    getTargetSystems(): SystemSeed[] {
        return this.children.flatMap((child) => child.getTargetSystems());
    }

    serialize(): MissionAndNodeSerialized {
        return {
            type: MissionNodeType.AND,
            children: this.children.map((child) => child.serialize())
        };
    }
}
