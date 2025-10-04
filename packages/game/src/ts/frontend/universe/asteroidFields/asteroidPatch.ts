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

import { type Quaternion } from "@babylonjs/core/Maths/math";
import { Space } from "@babylonjs/core/Maths/math.axis";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsMotionType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";

import { type Asteroid } from "@/frontend/assets/objects/asteroids";

export class AsteroidPatch {
    readonly parent: TransformNode;

    readonly instances: InstancedMesh[] = [];
    readonly instancePhysicsBodies: PhysicsBody[] = [];

    private readonly positions: Vector3[];
    private readonly rotations: Quaternion[];
    private readonly typeIndices: number[];

    private readonly rotationAxes: Vector3[] = [];
    private readonly rotationSpeeds: number[] = [];

    private nbInstances = 0;

    private readonly physicsRadius = 15e3;

    public static BATCH_SIZE = 10;

    constructor(
        positions: Vector3[],
        rotations: Quaternion[],
        typeIndices: number[],
        rotationAxes: Vector3[],
        rotationSpeeds: number[],
        parent: TransformNode,
    ) {
        this.parent = parent;

        this.positions = positions;
        this.rotations = rotations;
        this.typeIndices = typeIndices;

        this.rotationAxes = rotationAxes;
        this.rotationSpeeds = rotationSpeeds;
    }

    public clearInstances(): void {
        this.instancePhysicsBodies.forEach((body) => {
            body.dispose();
        });
        this.instances.forEach((instance) => {
            instance.dispose();
        });

        this.instancePhysicsBodies.length = 0;
        this.instances.length = 0;

        this.nbInstances = 0;
    }

    public createInstances(): void {
        this.clearInstances();
    }

    public update(controlsPosition: Vector3, asteroids: ReadonlyArray<Asteroid>, deltaSeconds: number): void {
        this.instances.forEach((instance, index) => {
            const distanceToCamera = Vector3.Distance(controlsPosition, instance.getAbsolutePosition());
            const rotationAxis = this.rotationAxes[index];
            const rotationSpeed = this.rotationSpeeds[index];
            const typeIndex = this.typeIndices[index];
            if (rotationAxis === undefined || rotationSpeed === undefined || typeIndex === undefined) {
                throw new Error("Rotation axis, speed, or type index is undefined.");
            }

            const shape = asteroids[typeIndex]?.physicsShape;
            if (shape === undefined) {
                throw new Error(`Asteroid physics shape for type index ${typeIndex} is undefined.`);
            }

            if (
                distanceToCamera < this.physicsRadius &&
                (instance.physicsBody === null || instance.physicsBody === undefined)
            ) {
                const instancePhysicsBody = new PhysicsBody(
                    instance,
                    PhysicsMotionType.DYNAMIC,
                    false,
                    this.parent.getScene(),
                );
                instancePhysicsBody.setMassProperties({ mass: 1000 });
                instancePhysicsBody.setAngularVelocity(rotationAxis.scale(rotationSpeed));
                instancePhysicsBody.setAngularDamping(0);
                instancePhysicsBody.disablePreStep = false;
                instancePhysicsBody.shape = shape;
                this.instancePhysicsBodies.push(instancePhysicsBody);
            } else if (
                distanceToCamera > this.physicsRadius + 1000 &&
                instance.physicsBody !== null &&
                instance.physicsBody !== undefined
            ) {
                const body = this.instancePhysicsBodies.find((body) => body === instance.physicsBody);
                if (body !== undefined) {
                    body.dispose();
                    this.instancePhysicsBodies.splice(this.instancePhysicsBodies.indexOf(body), 1);
                }
            }

            if (instance.physicsBody === null) {
                instance.rotate(rotationAxis, rotationSpeed * deltaSeconds, Space.WORLD);
            }
        });

        for (let i = 0; i < AsteroidPatch.BATCH_SIZE; i++) {
            if (this.nbInstances === this.positions.length) break;

            const typeIndex = this.typeIndices[this.nbInstances];
            if (typeIndex === undefined) {
                throw new Error(`Type index for instance ${this.nbInstances} is undefined.`);
            }

            const asteroid = asteroids[typeIndex];
            if (asteroid === undefined) {
                throw new Error(`Asteroid for type index ${typeIndex} is undefined.`);
            }

            const position = this.positions[this.nbInstances];
            const rotation = this.rotations[this.nbInstances];
            if (position === undefined || rotation === undefined) {
                throw new Error(`Position or rotation for instance ${this.nbInstances} is undefined.`);
            }

            const instance = asteroid.mesh.createInstance(`${this.parent.name}_AsteroidInstance${this.nbInstances}`);
            instance.position.copyFrom(position);
            instance.rotationQuaternion = rotation;
            instance.isPickable = false;
            instance.parent = this.parent;

            this.instances.push(instance);

            this.nbInstances++;
        }
    }

    public getNbInstances(): number {
        return this.nbInstances;
    }

    public setEnabled(enabled: boolean) {
        this.instances.forEach((instance) => {
            instance.setEnabled(enabled);
        });
    }

    public dispose() {
        this.clearInstances();
        this.positions.length = 0;
        this.rotations.length = 0;
        this.typeIndices.length = 0;
        this.rotationAxes.length = 0;
        this.rotationSpeeds.length = 0;
    }
}
