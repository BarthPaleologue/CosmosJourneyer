import { MissionNode, MissionNodeSerialized, MissionNodeType } from "../missionNode";
import { MissionContext } from "../../missionContext";
import { SystemSeed } from "../../../utils/systemSeed";

export type MissionXorNodeSerialized = MissionNodeSerialized;

export class MissionXorNode implements MissionNode {
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
        this.hasCompletedLock = this.children.filter((child) => child.isCompleted()).length === 1;
    }

    describe(originSeed: SystemSeed): string {
        return this.children.map((child) => child.describe(originSeed)).join(" xor ");
    }

    describeNextTask(context: MissionContext): Promise<string> {
        if (this.hasCompletedLock) return Promise.resolve("Mission completed");
        return Promise.resolve(this.children.map((child) => child.describeNextTask(context)).join(" xor "));
    }

    getTargetSystems(): SystemSeed[] {
        return this.children.flatMap((child) => child.getTargetSystems());
    }

    serialize(): MissionNodeSerialized {
        return {
            type: MissionNodeType.XOR,
            children: this.children.map((child) => child.serialize())
        };
    }
}
