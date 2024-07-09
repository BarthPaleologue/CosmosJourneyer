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
import { AbstractMesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { SolidPlume } from "../utils/solidPlume";

export abstract class AbstractThruster {
    readonly mesh: AbstractMesh;

    readonly helperMesh: AbstractMesh;

    protected throttle = 0;

    readonly plume: SolidPlume;

    readonly parentAggregate: PhysicsAggregate;

    protected constructor(mesh: AbstractMesh, direction: Vector3, parentAggregate: PhysicsAggregate) {
        this.mesh = mesh;

        this.plume = new SolidPlume(mesh, mesh.getScene());

        this.parentAggregate = parentAggregate;

        const thrusterHelper = MeshBuilder.CreateCylinder(this.mesh.name + "Helper", { height: 0.5, diameterTop: 0, diameterBottom: 0.5 }, mesh.getScene());
        const cubeMaterial = new StandardMaterial("cubeMat", mesh.getScene());
        cubeMaterial.diffuseColor = Color3.White();
        cubeMaterial.emissiveColor = Color3.White();
        thrusterHelper.material = cubeMaterial;
        thrusterHelper.parent = mesh;

        this.helperMesh = thrusterHelper;
        this.helperMesh.isVisible = false;
    }

    public getThrottle(): number {
        return this.throttle;
    }

    public update(deltaSeconds: number): void {
        this.plume.update(deltaSeconds);

        this.plume.setThrottle(this.throttle);

        if (this.throttle > 0) {
            this.helperMesh.scaling = new Vector3(0.8, 0.8, 0.8);
        } else {
            this.helperMesh.scaling = new Vector3(0.5, 0.5, 0.5);
        }
    }
}
