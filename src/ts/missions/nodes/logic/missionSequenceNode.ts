import { MissionNode, MissionNodeSerialized, MissionNodeType } from "../missionNode";
import { MissionContext } from "../../missionContext";
import { SystemSeed } from "../../../utils/systemSeed";

export type MissionSequenceNodeSerialized = MissionNodeSerialized & {
    activeChildIndex: number;
};

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

    setActiveChildIndex(index: number) {
        this.activeChildIndex = index;
    }

    describe(originSeed: SystemSeed): string {
        return this.children.map((child) => child.describe(originSeed)).join(" then ");
    }

    describeNextTask(context: MissionContext): Promise<string> {
        if (this.hasCompletedLock) return Promise.resolve("Mission completed");
        if (this.activeChildIndex >= this.children.length) return Promise.resolve("Mission completed");
        return this.children[this.activeChildIndex].describeNextTask(context);
    }

    getTargetSystems(): SystemSeed[] {
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
