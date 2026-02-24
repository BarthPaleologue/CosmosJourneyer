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

import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type UniverseBackend } from "@/backend/universe/universeBackend";

import { type MissionContext } from "../missionContext";
import { type MissionNode } from "./missionNode";

/**
 * Describes any node in the mission tree.
 */

export interface MissionNodeBase<TSerialized> {
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
    describe(originSystemCoordinates: StarSystemCoordinates, universeBackend: UniverseBackend): string;

    /**
     * Describes the next task to be done in the mission subtree.
     * @param context The mission context.
     * @param keyboardLayout The keyboard layout map to localize the keys.
     */
    describeNextTask(
        context: MissionContext,
        keyboardLayout: Map<string, string>,
        universeBackend: UniverseBackend,
    ): string;

    /**
     * Returns the target systems of the subtree.
     */
    getTargetSystems(): StarSystemCoordinates[];

    /**
     * Serializes the node recursively.
     */
    serialize(): TSerialized;
}
