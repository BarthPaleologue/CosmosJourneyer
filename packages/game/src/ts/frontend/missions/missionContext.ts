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

import { type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";

import { type Itinerary } from "@/backend/player/serializedPlayer";

import { type StarSystemController } from "@/frontend/universe/starSystemController";

import { type DeepReadonly } from "@/utils/types";

/**
 * Describes information used by mission nodes to update their state
 */
export type MissionContext = {
    /**
     * The current star system the player is in
     */
    currentSystem: StarSystemController;
    /**
     * The current itinerary of the player
     */
    currentItinerary: DeepReadonly<Itinerary> | null;
    /**
     * The world position of the player
     */
    playerPosition: Vector3;
    /**
     * Reference to the physics engine for ray/shape casting
     */
    physicsEngine: PhysicsEngineV2;
};
