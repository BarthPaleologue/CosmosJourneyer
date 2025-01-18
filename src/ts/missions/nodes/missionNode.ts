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

import { MissionContext } from "../missionContext";

import { StarSystemCoordinates } from "../../utils/coordinates/universeCoordinates";
import { StarSystemDatabase } from "../../starSystem/starSystemDatabase";

/**
 * Describes any node in the mission tree.
 */
export interface MissionNode {
    /**
     * Returns true if the node is completed, false otherwise.
     */
    isCompleted(): boolean;

    /**
     * Updates the state of the node recursively.
     * @param context The mission context.
     */
    updateState(context: MissionContext): void;

    /**
     * Returns true if the node is equal to another node, false otherwise.
     * @param other The other node to compare to.
     */
    equals(other: MissionNode): boolean;

    /**
     * Describes the node recursively.
     * @param originSystemCoordinates The seed of the system where the mission has been given.
     */
    describe(originSystemCoordinates: StarSystemCoordinates, starSystemDatabase: StarSystemDatabase): string;

    /**
     * Describes the next task to be done in the mission subtree.
     * @param context The mission context.
     * @param keyboardLayout The keyboard layout map to localize the keys.
     */
    describeNextTask(
        context: MissionContext,
        keyboardLayout: Map<string, string>,
        starSystemDatabase: StarSystemDatabase
    ): string;

    /**
     * Returns the target systems of the subtree.
     */
    getTargetSystems(): StarSystemCoordinates[];

    /**
     * Serializes the node recursively.
     */
    serialize(): MissionNodeSerialized;
}

/**
 * Describes the type of mission node. Useful for serialization/deserialization.
 */
export const enum MissionNodeType {
    FLY_BY = 0,
    TERMINATOR_LANDING = 1,
    ASTEROID_FIELD = 2,
    AND = 1000,
    OR = 1001,
    XOR = 1002,
    SEQUENCE = 1003
}

/**
 * Base type for all serialized mission nodes.
 * Nodes should specialize this type with their relevant fields.
 */
export type MissionNodeSerialized = {
    type: MissionNodeType;
    children: MissionNodeSerialized[];
};
