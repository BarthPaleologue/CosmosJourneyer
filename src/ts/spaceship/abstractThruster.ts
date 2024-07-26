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

import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { AbstractMesh, TrailMesh } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

export abstract class AbstractThruster {
    readonly mesh: AbstractMesh;

    protected throttle = 0;

    readonly trail: TrailMesh;

    readonly parentAggregate: PhysicsAggregate;

    protected constructor(mesh: AbstractMesh, direction: Vector3, parentAggregate: PhysicsAggregate) {
        this.mesh = mesh;

        this.trail = new TrailMesh("EngineTrail", mesh, mesh.getScene(), {
            diameter: 0.3,
            length: 15,
            sections: 16,
            autoStart: true,
        });

        const trailMaterial = new StandardMaterial("trailMat", mesh.getScene());
        trailMaterial.emissiveColor = Color3.White();
        trailMaterial.diffuseColor = Color3.White();

        this.trail.material = trailMaterial;

        this.parentAggregate = parentAggregate;
    }

    public getThrottle(): number {
        return this.throttle;
    }

    public update(deltaSeconds: number): void {
        //this.plume.setThrottle(this.throttle);
        this.trail.setEnabled(this.throttle > 0);
        this.trail.update();
    }
}
