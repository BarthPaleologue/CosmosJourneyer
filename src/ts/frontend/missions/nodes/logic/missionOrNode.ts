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

import { type MissionOrNodeSerialized } from "@/backend/missions/missionNodeSerialized";
import { MissionNodeType } from "@/backend/missions/missionNodeType";
import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import i18n from "@/i18n";

import { type MissionContext } from "../../missionContext";
import type { MissionNode } from "../missionNode";
import { type MissionNodeBase } from "../missionNodeBase";

/**
 * Node used to describe a set of tasks where only a subset must be completed in any order.
 */
export class MissionOrNode implements MissionNodeBase<MissionNodeType.OR> {
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
        this.children.forEach((child) => {
            child.updateState(context);
        });
        this.hasCompletedLock = this.children.some((child) => child.isCompleted());
    }

    describe(originSystemCoordinates: StarSystemCoordinates, starSystemDatabase: StarSystemDatabase): string {
        return this.children
            .map((child) => child.describe(originSystemCoordinates, starSystemDatabase))
            .join(` ${i18n.t("common:or")} `);
    }

    describeNextTask(
        context: MissionContext,
        keyboardLayout: Map<string, string>,
        starSystemDatabase: StarSystemDatabase,
    ): string {
        if (this.hasCompletedLock) return "Mission completed";
        return this.children
            .map((child) => child.describeNextTask(context, keyboardLayout, starSystemDatabase))
            .join(` ${i18n.t("common:or")} `);
    }

    getTargetSystems(): StarSystemCoordinates[] {
        return this.children.flatMap((child) => child.getTargetSystems());
    }

    serialize(): MissionOrNodeSerialized {
        return {
            type: MissionNodeType.OR,
            children: this.children.map((child) => child.serialize()),
        };
    }
}
