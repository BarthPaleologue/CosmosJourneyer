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

import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { type PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

import { degreesToRadians } from "@/utils/physics/unitConversions";

import { SolidPlume } from "./solidPlume";

export class Thruster {
    protected readonly maxAuthority = 3e3;

    readonly mesh: AbstractMesh;

    protected throttle = 0;

    readonly plume: SolidPlume;

    readonly parentAggregate: PhysicsAggregate;

    readonly light: SpotLight;
    readonly lightMaxIntensity = 5_000;

    constructor(mesh: AbstractMesh, direction: Vector3, parentAggregate: PhysicsAggregate) {
        this.mesh = mesh;

        this.plume = new SolidPlume(mesh, mesh.getScene());
        this.plume.solidParticleSystem.mesh.parent = mesh;

        this.parentAggregate = parentAggregate;

        this.light = new SpotLight(
            "thrusterLight",
            Vector3.Zero(),
            direction.negate(),
            degreesToRadians(160),
            2,
            mesh.getScene(),
            true,
        );
        this.light.range = 200;
        this.light.parent = mesh;
        this.light.position.addInPlace(direction.scale(1.0));
    }

    /**
     * @param throttle Throttle value in the [0, 1] range
     */
    public setThrottle(throttle: number): void {
        this.throttle = throttle;
        this.light.intensity = Math.abs(this.throttle) * this.lightMaxIntensity;
    }

    public updateThrottle(delta: number): void {
        this.setThrottle(Math.max(Math.min(1, this.throttle + delta), 0));
    }

    public getThrottle(): number {
        return this.throttle;
    }

    public update(deltaSeconds: number): void {
        this.plume.update(deltaSeconds);
        this.plume.setThrottle(this.throttle);
    }

    public dispose() {
        this.plume.solidParticleSystem.dispose();
        this.mesh.dispose();
        this.light.dispose();
    }
}
