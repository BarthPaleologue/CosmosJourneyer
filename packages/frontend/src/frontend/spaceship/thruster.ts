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

import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { type PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

import { SolidPlume } from "./solidPlume";

export class Thruster {
    protected readonly maxAuthority = 3e3;

    readonly mesh: AbstractMesh;

    protected throttle = 0;

    readonly plume: SolidPlume;

    readonly parentAggregate: PhysicsAggregate;

    readonly light: PointLight;
    readonly lightMinIntensity = 10.0;
    readonly lightMaxIntensity = 100.0;

    constructor(mesh: AbstractMesh, direction: Vector3, parentAggregate: PhysicsAggregate) {
        this.mesh = mesh;

        this.plume = new SolidPlume(mesh, mesh.getScene());
        this.plume.solidParticleSystem.mesh.parent = mesh;

        this.parentAggregate = parentAggregate;

        this.light = new PointLight("thrusterLight", Vector3.Zero(), mesh.getScene());
        this.light.parent = mesh;
        this.light.position.addInPlace(direction.scale(1.0));
    }

    public setThrottle(throttle: number): void {
        this.throttle = throttle;
    }

    public updateThrottle(delta: number): void {
        this.throttle = Math.max(Math.min(1, this.throttle + delta), 0);
    }

    public getThrottle(): number {
        return this.throttle;
    }

    public update(deltaSeconds: number): void {
        this.plume.update(deltaSeconds);
        this.plume.setThrottle(this.throttle);

        this.light.intensity =
            this.lightMinIntensity + (this.lightMaxIntensity - this.lightMinIntensity) * Math.max(0, this.throttle);
    }

    public dispose() {
        this.plume.solidParticleSystem.dispose();
        this.mesh.dispose();
        this.light.dispose();
    }
}
