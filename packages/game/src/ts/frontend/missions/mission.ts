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

import { assertUnreachable } from "@cosmos-journeyer/typescript";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { StarSystemCoordinates, UniverseObjectId } from "@cosmos-journeyer/universe-model";
import type { TFunction } from "i18next";

import { MissionType } from "@/backend/missions/missionSerialized";
import type { MissionSerialized } from "@/backend/missions/missionSerialized";
import type { UniverseBackend } from "@/backend/universe/universeBackend";

import type { MissionContext } from "./missionContext";
import { deserializeMissionNode } from "./nodes/deserializeNode";
import type { MissionNode } from "./nodes/missionNode";

/**
 * Mission with a task tree, reward, issuing station, and display category.
 */
export class Mission {
    readonly tree: MissionNode;

    readonly reward: number;

    readonly missionGiver: UniverseObjectId;

    readonly missionType: MissionType;

    /**
     * @param tree - Tasks required to complete the mission.
     * @param reward - Completion reward.
     * @param missionGiver - Station offering the mission.
     * @param missionType - Category used for localized display.
     */
    constructor(tree: MissionNode, reward: number, missionGiver: UniverseObjectId, missionType: MissionType) {
        this.tree = tree;
        this.reward = reward;
        this.missionGiver = missionGiver;
        this.missionType = missionType;
    }

    /**
     * @param context - Current mission state and player location.
     * @param keyboardLayout - Keyboard code-to-label map.
     * @param universeBackend - Universe lookup for target objects.
     * @param t - Translation function for player-facing text.
     * @returns The localized next task instruction.
     */
    describeNextTask(
        context: MissionContext,
        keyboardLayout: Map<string, string>,
        universeBackend: UniverseBackend,
        t: TFunction,
    ): string {
        return this.tree.describeNextTask(context, keyboardLayout, universeBackend, t);
    }

    /**
     * @param other - Mission whose task tree is compared.
     * @returns Whether both missions have the same task tree.
     */
    equals(other: Mission): boolean {
        return this.tree.equals(other.tree);
    }

    /**
     * @returns The mission completion reward.
     */
    getReward(): number {
        return this.reward;
    }

    /**
     * @returns Systems the player still needs to visit.
     */
    getTargetSystems(): StarSystemCoordinates[] {
        return this.tree.getTargetSystems();
    }

    /**
     * @returns Objects that should guide the player in the current system.
     */
    getGuidanceTargetObjectIds(): UniverseObjectId[] {
        return this.tree.getGuidanceTargetObjectIds();
    }

    /**
     * @param t - Translation function for player-facing text.
     * @returns The localized mission category.
     */
    getTypeString(t: TFunction): string {
        switch (this.missionType) {
            case MissionType.SIGHT_SEEING_FLY_BY:
                return t("missions:sightseeing:flyBy");
            case MissionType.SIGHT_SEEING_TERMINATOR_LANDING:
                return t("missions:sightseeing:terminatorLanding");
            case MissionType.SIGHT_SEEING_ASTEROID_FIELD:
                return t("missions:sightseeing:asteroidFieldTrek");
            default:
                return assertUnreachable(this.missionType);
        }
    }

    /**
     * Localizes the task tree relative to the system that issued the mission.
     * @param universeBackend - Universe lookup for target objects.
     * @param t - Translation function for player-facing text.
     * @returns The localized mission description.
     */
    describe(universeBackend: UniverseBackend, t: TFunction): string {
        return this.tree.describe(this.missionGiver.systemCoordinates, universeBackend, t);
    }

    /**
     * @returns Whether the task tree has been completed.
     */
    isCompleted(): boolean {
        return this.tree.isCompleted();
    }

    /**
     * @returns Serialized mission data for save files.
     */
    serialize(): MissionSerialized {
        return {
            missionGiver: this.missionGiver,
            tree: this.tree.serialize(),
            reward: this.reward,
            type: this.missionType,
        };
    }

    /**
     * Updates unfinished tasks from the current mission context.
     * @param context - Current mission state and player location.
     */
    update(context: MissionContext): void {
        if (this.isCompleted()) {
            return;
        }
        this.tree.updateState(context);
    }

    static Deserialize(
        missionSerialized: DeepReadonly<MissionSerialized>,
        universeBackend: UniverseBackend,
    ): Mission | null {
        try {
            const missionTree = deserializeMissionNode(missionSerialized.tree, universeBackend);
            if (missionTree === null) {
                return null;
            }

            return new Mission(
                missionTree,
                missionSerialized.reward,
                missionSerialized.missionGiver,
                missionSerialized.type,
            );
        } catch (error) {
            // Handle invalid mission data gracefully
            console.warn("Failed to deserialize mission:", error);
            return null;
        }
    }
}
