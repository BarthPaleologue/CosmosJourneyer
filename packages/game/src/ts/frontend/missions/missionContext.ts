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

import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";

import type { Itinerary } from "@/backend/player/serializedPlayer";

import type { StarSystemController } from "@/frontend/universe/starSystemController";

/**
 * Player and universe state consumed when mission nodes update.
 */
export type MissionContext = {
    currentSystem: StarSystemController;
    currentItinerary: DeepReadonly<Itinerary> | null;
    playerPosition: Vector3;
    /** Enables ray and shape casts for mission checks. */
    physicsEngine: PhysicsEngineV2;
};
