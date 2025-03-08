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

import { MissionOrNodeSerialized } from "../missionNodeSerialized";
import { MissionNodeType } from "../missionNodeType";
import { MissionNodeBase } from "../missionNodeBase";
import { MissionContext } from "../../missionContext";
import i18n from "../../../i18n";
import { StarSystemCoordinates } from "../../../utils/coordinates/starSystemCoordinates";
import { StarSystemDatabase } from "../../../starSystem/starSystemDatabase";
import type { MissionNode } from "../missionNode";

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

    describe(originSystemCoordinates: StarSystemCoordinates, starSystemDatabase: StarSystemDatabase): string {
        return this.children
            .map((child) => child.describe(originSystemCoordinates, starSystemDatabase))
            .join(` ${i18n.t("common:or")} `);
    }

    describeNextTask(
        context: MissionContext,
        keyboardLayout: Map<string, string>,
        starSystemDatabase: StarSystemDatabase
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
            children: this.children.map((child) => child.serialize())
        };
    }
}
