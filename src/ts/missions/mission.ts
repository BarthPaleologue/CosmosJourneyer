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

import { MissionNode, MissionNodeSerialized } from "./nodes/missionNode";
import { MissionContext } from "./missionContext";
import { getObjectModelByUniverseId, getUniverseIdForSpaceStationModel } from "../utils/coordinates/orbitalObjectId";
import i18n from "../i18n";
import { StarSystemCoordinates, UniverseObjectId } from "../utils/coordinates/universeCoordinates";
import { deserializeMissionNode } from "./nodes/deserializeNode";
import { OrbitalFacilityModel } from "../spacestation/orbitalFacility";

/**
 * Registered mission types. Those are used to display localized strings in the UI
 */
export const enum MissionType {
    SIGHT_SEEING_FLY_BY,
    SIGHT_SEEING_TERMINATOR_LANDING,
    SIGHT_SEEING_ASTEROID_FIELD
}

/**
 * Serialized mission object as stored in save files
 */
export type MissionSerialized = {
    missionGiver: UniverseObjectId;
    type: MissionType;
    tree: MissionNodeSerialized;
    reward: number;
};

/**
 * General mission abstraction. The mission can have any arbitrary task tree and reward.
 * If you want to create new mission archetypes, you should register a new enum variant in MissionType
 */
export class Mission {
    /**
     * The task tree that the player has to complete to finish the mission
     */
    readonly tree: MissionNode;

    /**
     * The reward that the player gets for completing the mission
     */
    readonly reward: number;

    /**
     * The space station that gave the mission
     */
    readonly missionGiver: OrbitalFacilityModel;

    /**
     * The type of the mission (useful for displaying localized strings)
     */
    readonly missionType: MissionType;

    /**
     * Creates a new mission
     * @param tree The task tree that the player has to complete to finish the mission
     * @param reward The reward that the player gets for completing the mission
     * @param missionGiver The space station that gave the mission
     * @param missionType The type of the mission (useful for displaying localized strings)
     */
    constructor(tree: MissionNode, reward: number, missionGiver: OrbitalFacilityModel, missionType: MissionType) {
        this.tree = tree;
        this.reward = reward;
        this.missionGiver = missionGiver;
        this.missionType = missionType;
    }

    /**
     * Describes the next task that the player has to complete given the current mission context
     * @param context The current mission context
     */
    async describeNextTask(context: MissionContext): Promise<string> {
        return await this.tree.describeNextTask(context);
    }

    /**
     * Returns true if the two missions have the same task tree
     * @param other The other mission to compare to
     */
    equals(other: Mission): boolean {
        return this.tree.equals(other.tree);
    }

    /**
     * Returns the reward that the player gets for completing the mission
     */
    getReward(): number {
        return this.reward;
    }

    /**
     * Returns all the current target systems that the player has to visit to complete the mission
     */
    getTargetSystems(): StarSystemCoordinates[] {
        return this.tree.getTargetSystems();
    }

    /**
     * Returns the localized string for the mission type
     */
    getTypeString(): string {
        switch (this.missionType) {
            case MissionType.SIGHT_SEEING_FLY_BY:
                return i18n.t("missions:sightseeing:flyBy");
            case MissionType.SIGHT_SEEING_TERMINATOR_LANDING:
                return i18n.t("missions:sightseeing:terminatorLanding");
            case MissionType.SIGHT_SEEING_ASTEROID_FIELD:
                return i18n.t("missions:sightseeing:asteroidFieldTrek");
            default:
                throw new Error(`Unknown sight seeing type: ${this.missionType}`);
        }
    }

    /**
     * Returns a string describing the mission using the mission tree and the origin seed
     */
    describe(): string {
        return this.tree.describe(this.missionGiver.starSystemCoordinates);
    }

    /**
     * Returns true if the mission is completed, false otherwise
     */
    isCompleted(): boolean {
        return this.tree.isCompleted();
    }

    /**
     * Serializes the mission to a JSON object for storage in save files
     */
    serialize(): MissionSerialized {
        return {
            missionGiver: getUniverseIdForSpaceStationModel(this.missionGiver),
            tree: this.tree.serialize(),
            reward: this.reward,
            type: this.missionType
        };
    }

    /**
     * Updates the mission state recursively given the current mission context
     * @param context The current mission context
     */
    update(context: MissionContext): void {
        if (this.isCompleted()) return;
        this.tree.updateState(context);
    }

    static Deserialize(missionSerialized: MissionSerialized) {
        return new Mission(
            deserializeMissionNode(missionSerialized.tree),
            missionSerialized.reward,
            getObjectModelByUniverseId(missionSerialized.missionGiver) as OrbitalFacilityModel,
            missionSerialized.type
        );
    }
}
