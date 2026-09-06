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
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import type { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";

import { CollisionMask } from "@/settings";

export class Altimeter {
    private readonly physicsEngine: PhysicsEngineV2;

    private static readonly MAX_RANGE = 300_000;

    private readonly raycastResult = new PhysicsRaycastResult();

    private lastAltitude: number | null = null;

    constructor(physicsEngine: PhysicsEngineV2) {
        this.physicsEngine = physicsEngine;
    }

    public update(from: Vector3, direction: Vector3): void {
        const start = from;
        const end = from.add(direction.scale(Altimeter.MAX_RANGE));

        this.physicsEngine.raycastToRef(start, end, this.raycastResult, {
            collideWith: CollisionMask.ENVIRONMENT,
        });

        this.lastAltitude = this.raycastResult.hasHit ? this.raycastResult.hitDistance : null;
    }

    public getAltitude(): number | null {
        return this.lastAltitude;
    }
}
