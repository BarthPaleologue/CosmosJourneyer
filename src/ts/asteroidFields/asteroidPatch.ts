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
import { InstancedMesh, PhysicsAggregate, PhysicsMotionType, PhysicsShapeType, Quaternion, Vector3 } from "@babylonjs/core";

export class AsteroidPatch implements IPatch {
    private baseMesh: Mesh | null = null;

    readonly parent: TransformNode;

    readonly instances: InstancedMesh[] = [];
    readonly instanceAggregates: PhysicsAggregate[] = [];

    private positions: Vector3[];
    private rotations: Quaternion[];
    private scalings: Vector3[];

    private nbInstances = 0;

    private readonly batchSize = 5;

    constructor(positions: Vector3[], rotations: Quaternion[], scalings: Vector3[], parent: TransformNode) {
        this.parent = parent;

        this.positions = positions;
        this.rotations = rotations;
        this.scalings = scalings;
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

    public update(): void {
        if (this.baseMesh === null) return;

        for (let i = 0; i < this.batchSize; i++) {
            if (this.nbInstances === this.positions.length) return;

            const instance = this.baseMesh.createInstance(`instance${this.nbInstances}`);
            instance.position.copyFrom(this.positions[this.nbInstances]);
            instance.rotationQuaternion = this.rotations[this.nbInstances];
            instance.scaling.copyFrom(this.scalings[this.nbInstances]);
            instance.alwaysSelectAsActiveMesh = true;
            instance.isPickable = false;
            
            this.instances.push(instance);

            instance.parent = this.parent;

            const instanceAggregate = new PhysicsAggregate(instance, PhysicsShapeType.MESH, { mass: 1 }, this.baseMesh.getScene());
            instanceAggregate.body.setAngularVelocity(new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5));
            instanceAggregate.body.disablePreStep = false;
            this.instanceAggregates.push(instanceAggregate);

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
