//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { type MissionSequenceNodeSerialized } from "@/backend/missions/missionNodeSerialized";
import { MissionNodeType } from "@/backend/missions/missionNodeType";
import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { type MissionContext } from "../../missionContext";
import type { MissionNode } from "../missionNode";
import { type MissionNodeBase } from "../missionNodeBase";

/**
 * Node used to describe a sequence of tasks that must be completed in order.
 */
export class MissionSequenceNode implements MissionNodeBase<MissionNodeType.SEQUENCE> {
    public children: MissionNode[];

    private hasCompletedLock = false;

    private activeChildIndex = 0;

    constructor(children: MissionNode[]) {
        this.children = children;
    }

    isCompleted(): boolean {
        return this.hasCompletedLock;
    }

    equals(other: MissionNode): boolean {
        if (!(other instanceof MissionSequenceNode)) return false;
        if (this.children.length !== other.children.length) return false;
        for (const [i, thisChild] of this.children.entries()) {
            const otherChild = other.children[i];
            if (otherChild === undefined) {
                continue;
            }
            if (!thisChild.equals(otherChild)) return false;
        }
        return true;
    }

    updateState(context: MissionContext) {
        if (this.hasCompletedLock) return;
        const activeChild = this.children[this.activeChildIndex];
        if (activeChild === undefined) {
            return;
        }

        activeChild.updateState(context);
        if (activeChild.isCompleted()) {
            this.activeChildIndex++;
        }

        this.hasCompletedLock = this.children.every((child) => child.isCompleted());
    }

    /**
     * Set the active child index. Useful when deserializing an ongoing mission.
     * @param index The index of the child to set as active.
     */
    setActiveChildIndex(index: number) {
        if (index < 0 || index >= this.children.length) {
            throw new Error(
                `Invalid index ${index} for mission sequence node. Must be between 0 and ${this.children.length - 1}`,
            );
        }
        this.activeChildIndex = index;
    }

    describe(originSystemCoordinates: StarSystemCoordinates, starSystemDatabase: StarSystemDatabase): string {
        return this.children.map((child) => child.describe(originSystemCoordinates, starSystemDatabase)).join(" then ");
    }

    describeNextTask(
        context: MissionContext,
        keyboardLayout: Map<string, string>,
        starSystemDatabase: StarSystemDatabase,
    ): string {
        if (this.hasCompletedLock) return "Mission completed";
        const activeChild = this.children[this.activeChildIndex];
        if (activeChild === undefined) return "Mission error: activeChildIndex out of bounds";
        return activeChild.describeNextTask(context, keyboardLayout, starSystemDatabase);
    }

    getTargetSystems(): StarSystemCoordinates[] {
        const activeChild = this.children[this.activeChildIndex];
        if (activeChild === undefined) {
            return [];
        }

        return activeChild.getTargetSystems();
    }

    serialize(): MissionSequenceNodeSerialized {
        return {
            type: MissionNodeType.SEQUENCE,
            children: this.children.map((child) => child.serialize()),
            activeChildIndex: this.activeChildIndex,
        };
    }
}
