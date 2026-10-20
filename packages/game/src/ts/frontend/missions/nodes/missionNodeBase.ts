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

import type { StarSystemCoordinates, UniverseObjectId } from "@cosmos-journeyer/universe-model";
import type { TFunction } from "i18next";

import type { UniverseBackend } from "@/backend/universe/universeBackend";

import type { MissionContext } from "../missionContext";
import type { MissionNode } from "./missionNode";

/**
 * Contract shared by mission task and logic nodes.
 */

export interface MissionNodeBase<TSerialized> {
    /**
     * @returns Whether this node is complete.
     */
    isCompleted(): boolean;

    /**
     * @param context - Current mission state and player location.
     */
    updateState(context: MissionContext): void;

    /**
     * @param other - Node whose task tree is compared.
     * @returns Whether both nodes represent the same task tree.
     */
    equals(other: MissionNode): boolean;

    /**
     * @param originSystemCoordinates - Coordinates of the system that issued the mission.
     * @param universeBackend - Universe lookup for referenced objects.
     * @param t - Translation function for player-facing text.
     * @returns Localized description of this subtree.
     */
    describe(originSystemCoordinates: StarSystemCoordinates, universeBackend: UniverseBackend, t: TFunction): string;

    /**
     * @param context - Current mission state and player location.
     * @param keyboardLayout - Keyboard code-to-label map.
     * @param universeBackend - Universe lookup for referenced objects.
     * @param t - Translation function for player-facing text.
     * @returns Localized instructions for the next task.
     */
    describeNextTask(
        context: MissionContext,
        keyboardLayout: Map<string, string>,
        universeBackend: UniverseBackend,
        t: TFunction,
    ): string;

    /**
     * @returns Systems containing active targets in this subtree.
     */
    getTargetSystems(): StarSystemCoordinates[];

    /**
     * @returns Objects that should guide the player in the current system.
     */
    getGuidanceTargetObjectIds(): UniverseObjectId[];

    /**
     * @returns Serialized state for this subtree.
     */
    serialize(): TSerialized;
}
