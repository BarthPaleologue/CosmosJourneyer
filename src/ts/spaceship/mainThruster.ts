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

import { Vector3 } from "@babylonjs/core/Maths/math";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { AbstractThruster } from "./abstractThruster";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

export class MainThruster extends AbstractThruster {
    protected readonly maxAuthority = 3e3;

    constructor(mesh: AbstractMesh, direction: Vector3, parentAggregate: PhysicsAggregate) {
        super(mesh, direction, parentAggregate);
    }

    public setThrottle(throttle: number): void {
        this.throttle = throttle;
    }

    public updateThrottle(delta: number): void {
        this.throttle = Math.max(Math.min(1, this.throttle + delta), 0);
    }
}
