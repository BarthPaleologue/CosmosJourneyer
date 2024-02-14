//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { AbstractThruster } from "./abstractThruster";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { getDownwardDirection } from "../uberCore/transforms/basicTransform";

export class RCSThruster extends AbstractThruster {
    protected override maxAuthority = 30;

    constructor(mesh: AbstractMesh, direction: Vector3, parentAggregate: PhysicsAggregate) {
        super(mesh, direction, parentAggregate);

        this.plume.maxSize = 0.3;
        this.plume.minSize = 0.3;

        this.plume.minLifeTime = 0.2;
        this.plume.maxLifeTime = 0.2;
    }

    public activate(): void {
        this.throttle = 1;
    }

    public setThrottle(throttle: number): void {
        if (throttle < 0 || throttle > 1) throw new Error("Throttle must be between 0 and 1");
        this.throttle = throttle;
    }

    public deactivate(): void {
        this.throttle = 0;
    }

    public applyForce(): void {
        // the nozzle is directed upward
        const thrustDirection = getDownwardDirection(this.mesh);
        const force = thrustDirection.scale(this.maxAuthority * this.throttle);

        this.parentAggregate.body.applyForce(force, this.mesh.getAbsolutePosition());
    }
}
