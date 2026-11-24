//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import type { Scene } from "@babylonjs/core/scene";

/**
 * Retrieves the scene's physics engine using the project's v2 engine type.
 * @param scene - Babylon.js scene whose physics engine has already been initialized.
 * @returns The attached v2 engine.
 */
export function getPhysicsEngineV2(scene: Scene): PhysicsEngineV2 {
    const engine = scene.getPhysicsEngine();
    if (!(engine instanceof PhysicsEngineV2)) {
        throw new Error("Scene is not using the V2 physics engine");
    }
    return engine;
}
