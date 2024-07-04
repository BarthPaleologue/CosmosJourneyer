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

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { IPatch } from "../planets/telluricPlanet/terrain/instancePatch/iPatch";
import { InstancedMesh, PhysicsAggregate, PhysicsShapeType, Quaternion, Space, Vector3 } from "@babylonjs/core";

export class AsteroidPatch implements IPatch {
    private baseMesh: Mesh | null = null;

    readonly parent: TransformNode;

    readonly instances: InstancedMesh[] = [];
    readonly instanceAggregates: PhysicsAggregate[] = [];

    private positions: Vector3[];
    private rotations: Quaternion[];
    private scalings: Vector3[];

    private rotationAxes: Vector3[] = [];
    private rotationSpeeds: number[] = [];

    private nbInstances = 0;

    private readonly physicsRadius = 10e3;

    private readonly batchSize = 3;

    constructor(positions: Vector3[], rotations: Quaternion[], scalings: Vector3[], rotationAxes: Vector3[], rotationSpeeds: number[], parent: TransformNode) {
        this.parent = parent;

        this.positions = positions;
        this.rotations = rotations;
        this.scalings = scalings;

        this.rotationAxes = rotationAxes;
        this.rotationSpeeds = rotationSpeeds;
    }

    public clearInstances(): void {
        if (this.baseMesh === null) return;
        this.instanceAggregates.forEach(aggregate => aggregate.dispose());
        this.instances.forEach(instance => instance.dispose());

        this.instanceAggregates.length = 0;
        this.instances.length = 0;

        this.baseMesh = null;
        this.nbInstances = 0;
    }

    public createInstances(baseMesh: TransformNode): void {
        this.clearInstances();
        if (!(baseMesh instanceof Mesh)) {
            throw new Error("Tried to create instances from a non-mesh object. Try using HierarchyInstancePatch instead if you want to use a TransformNode.");
        }
        this.baseMesh = baseMesh as Mesh;
    }

    public update(controlsPosition: Vector3, deltaSeconds: number): void {
        if (this.baseMesh === null) return;

        this.instances.forEach((instance, index) => {
            const distanceToCamera = Vector3.Distance(controlsPosition, instance.getAbsolutePosition());
            if(distanceToCamera < this.physicsRadius && (instance.physicsBody === null || instance.physicsBody === undefined)) {
                const instanceAggregate = new PhysicsAggregate(instance, PhysicsShapeType.CONVEX_HULL, { mass: 1000 }, this.baseMesh?.getScene());
                instanceAggregate.body.setAngularVelocity(this.rotationAxes[index].scale(this.rotationSpeeds[index]));
                instanceAggregate.body.setAngularDamping(0);
                instanceAggregate.body.disablePreStep = false;
                this.instanceAggregates.push(instanceAggregate);
            } else if(distanceToCamera > this.physicsRadius + 1000 && instance.physicsBody !== null && instance.physicsBody !== undefined) {
                const aggregate = this.instanceAggregates.find(aggregate => aggregate.body === instance.physicsBody);
                if(aggregate) {
                    aggregate.dispose();
                    this.instanceAggregates.splice(this.instanceAggregates.indexOf(aggregate), 1);
                } else {
                    throw new Error("Physics body not found in instance aggregates.");
                }
            }

            if(instance.physicsBody === null || instance.physicsBody === undefined) {
                instance.rotate(this.rotationAxes[index], this.rotationSpeeds[index] * deltaSeconds, Space.WORLD);
            }
        });

        for (let i = 0; i < this.batchSize; i++) {
            if (this.nbInstances === this.positions.length) return;

            const instance = this.baseMesh.createInstance(`instance${this.nbInstances}`);
            instance.position.copyFrom(this.positions[this.nbInstances]);
            instance.rotationQuaternion = this.rotations[this.nbInstances];
            instance.scaling.copyFrom(this.scalings[this.nbInstances]);
            instance.alwaysSelectAsActiveMesh = true;
            instance.isPickable = false;
            instance.parent = this.parent;
            
            this.instances.push(instance);

            this.nbInstances++;
        }
    }

    public getNbInstances(): number {
        if (this.baseMesh === null) return 0;
        return this.baseMesh.thinInstanceCount;
    }

    public setEnabled(enabled: boolean) {
        if (this.baseMesh === null) return;
        this.baseMesh.setEnabled(enabled);
    }

    public getBaseMesh(): Mesh {
        if (this.baseMesh === null) throw new Error("Tried to get base mesh but no base mesh was set.");
        return this.baseMesh;
    }

    public dispose() {
        this.clearInstances();
        if (this.baseMesh !== null) this.baseMesh.dispose();
    }
}
