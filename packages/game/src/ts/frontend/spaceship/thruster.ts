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
import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

import { degreesToRadians } from "@/utils/physics/unitConversions";

import type { Transformable } from "../universe/architecture/transformable";
import { ThrusterExhaust } from "./thrusterExhaust";

export class Thruster implements Transformable {
    protected readonly maxAuthority = 3e3;

    private readonly mesh: AbstractMesh;

    protected throttle = 0;

    readonly exhaust: ThrusterExhaust;

    readonly parentAggregate: PhysicsAggregate;

    readonly light: SpotLight;
    readonly lightMaxIntensity = 5_000;

    constructor(mesh: AbstractMesh, direction: Vector3, parentAggregate: PhysicsAggregate) {
        this.mesh = mesh;

        this.exhaust = new ThrusterExhaust(`${mesh.name}Exhaust`, mesh.getScene(), {
            crossSection: {
                x: 0.17,
                z: 0.3,
            },
            emissionIntensity: 3.0,
            rayMarchStepCount: 16,
        });
        this.exhaust.getTransform().parent = mesh;
        this.exhaust.getTransform().rotationQuaternion = Quaternion.FromUnitVectorsToRef(
            Vector3.Down(),
            direction.normalizeToNew().negate(),
            Quaternion.Identity(),
        );
        this.exhaust.getTransform().rotate(Vector3.Down(), Math.PI / 2);
        this.exhaust.getTransform().scaling.x = 5;
        this.exhaust.getTransform().scaling.z = 5;
        this.exhaust.setLength(8);
        this.exhaust.setPressure(1, 3);

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

    public getTransform(): TransformNode {
        return this.mesh;
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
        this.exhaust.setThrottle(this.throttle);
        this.exhaust.update(deltaSeconds);
    }

    public dispose() {
        this.exhaust.dispose();
        this.mesh.dispose();
        this.light.dispose();
    }
}
