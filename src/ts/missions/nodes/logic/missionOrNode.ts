import { MissionNode, MissionNodeSerialized, MissionNodeType } from "../missionNode";
import { MissionContext } from "../../missionContext";
import i18n from "../../../i18n";

import { StarSystemCoordinates } from "../../../saveFile/universeCoordinates";

export type MissionOrNodeSerialized = MissionNodeSerialized;

/**
 * Node used to describe a set of tasks where only a subset must be completed in any order.
 */
export class MissionOrNode implements MissionNode {
    readonly children: MissionNode[];

    private hasCompletedLock = false;

    constructor(children: MissionNode[]) {
        this.children = children;
    }

    isCompleted(): boolean {
        return this.hasCompletedLock;
    }

    equals(other: MissionNode): boolean {
        if (!(other instanceof MissionOrNode)) return false;
        if (this.children.length !== other.children.length) return false;
        for (let i = 0; i < this.children.length; i++) {
            if (!this.children[i].equals(other.children[i])) return false;
        }
        return true;
    }

    updateState(context: MissionContext) {
        if (this.hasCompletedLock) return;
        this.children.forEach((child) => child.updateState(context));
        this.hasCompletedLock = this.children.some((child) => child.isCompleted());
    }

    describe(originSystemCoordinates: StarSystemCoordinates): string {
        return this.children.map((child) => child.describe(originSystemCoordinates)).join(` ${i18n.t("common:or")} `);
    }

    describeNextTask(context: MissionContext): Promise<string> {
        if (this.hasCompletedLock) return Promise.resolve("Mission completed");
        return Promise.resolve(this.children.map((child) => child.describeNextTask(context)).join(` ${i18n.t("common:or")} `));
    }

    getTargetSystems(): StarSystemCoordinates[] {
        return this.children.flatMap((child) => child.getTargetSystems());
    }

    serialize(): MissionNodeSerialized {
        return {
            type: MissionNodeType.OR,
            children: this.children.map((child) => child.serialize())
        };
    }
}
