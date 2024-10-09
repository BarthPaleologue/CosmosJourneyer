import { MissionNode, MissionNodeSerialized, MissionNodeType } from "../missionNode";
import { MissionContext } from "../../missionContext";
import i18n from "../../../i18n";
import { SystemSeed } from "../../../utils/systemSeed";

export type MissionOrNodeSerialized = MissionNodeSerialized;

export class MissionOrNode implements MissionNode {
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
        this.hasCompletedLock = this.children.some((child) => child.isCompleted());
    }

    describe(originSeed: SystemSeed): string {
        return this.children.map((child) => child.describe(originSeed)).join(` ${i18n.t("common:or")} `);
    }

    describeNextTask(context: MissionContext): Promise<string> {
        if (this.hasCompletedLock) return Promise.resolve("Mission completed");
        return Promise.resolve(this.children.map((child) => child.describeNextTask(context)).join(` ${i18n.t("common:or")} `));
    }

    getTargetSystems(): SystemSeed[] {
        return this.children.flatMap((child) => child.getTargetSystems());
    }

    serialize(): MissionNodeSerialized {
        return {
            type: MissionNodeType.OR,
            children: this.children.map((child) => child.serialize())
        };
    }
}
