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

import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { type IPatch } from "./iPatch";
import { decomposeModelMatrix } from "./matrixBuffer";

export class InstancePatch implements IPatch {
    readonly parent: TransformNode;

    readonly instances: InstancedMesh[] = [];

    private transforms: Array<{
        position: Vector3;
        rotation: Quaternion;
        scaling: Vector3;
    }> = [];

    private currentLod: { mesh: Mesh; lodIndex: number } | null = null;
    private readonly lods: { mesh: Mesh; distance: number }[] = [];

    constructor(parent: TransformNode, matrixBuffer: Float32Array) {
        this.parent = parent;

        // decompose matrix buffer into position, rotation and scaling
        for (let i = 0; i < matrixBuffer.length; i += 16) {
            const matrixSubBuffer = matrixBuffer.subarray(i, i + 16);
            const position = Vector3.Zero();
            const rotation = Quaternion.Zero();
            const scaling = Vector3.Zero();
            decomposeModelMatrix(matrixSubBuffer, position, rotation, scaling);

            this.transforms.push({
                position,
                rotation,
                scaling,
            });
        }
    }

    public clearInstances(): void {
        if (this.currentLod === null) return;
        for (const instance of this.instances) {
            instance.dispose();
        }
        this.currentLod = null;
    }

    public createInstances(baseMeshes: { mesh: Mesh; distance: number }[]): void {
        this.clearInstances();
        this.lods.length = 0;

        for (const baseMesh of baseMeshes) {
            this.lods.push(baseMesh);
        }

        const currentLod = this.lods.at(0);
        if (currentLod === undefined) throw new Error("No lod mesh was set.");
        this.currentLod = { mesh: currentLod.mesh, lodIndex: 0 };
        this.sendToGPU();
    }

    private sendToGPU() {
        if (this.currentLod === null) throw new Error("Tried to send matrix buffer to GPU but no base mesh was set.");
        for (const transform of this.transforms) {
            const instance = this.currentLod.mesh.createInstance(`instance${this.instances.length}`);
            instance.position.copyFrom(transform.position.add(this.currentLod.mesh.position));
            instance.rotationQuaternion = transform.rotation;
            instance.scaling.copyFrom(transform.scaling);
            this.instances.push(instance);

            instance.parent = this.parent;
        }
    }

    public setEnabled(enabled: boolean) {
        for (const instance of this.instances) {
            instance.setEnabled(enabled);
        }
    }

    public isEnabled(): boolean {
        const firstInstance = this.instances[0];
        if (firstInstance === undefined) return false;
        return firstInstance.isEnabled();
    }

    public handleLod(distance: number): void {
        if (this.lods.length === 0) throw new Error("No lod meshes were set.");
        if (this.currentLod === null) throw new Error("No lod mesh was set.");

        // check for furthest away lod
        for (const [i, lod] of Array.from(this.lods.entries()).reverse()) {
            if (distance > lod.distance) {
                if (i === this.currentLod.lodIndex) break;

                this.clearInstances();
                this.currentLod = { mesh: lod.mesh, lodIndex: i };
                this.sendToGPU();
                break;
            }
        }
    }

    public getCurrentMesh(): Mesh {
        if (this.currentLod === null) throw new Error("Tried to get base mesh but no base mesh was set.");
        return this.currentLod.mesh;
    }

    public getLodMeshes(): Mesh[] {
        return this.lods.map((lod) => lod.mesh);
    }

    public getNbInstances(): number {
        return this.instances.length;
    }

    public dispose() {
        this.clearInstances();
        this.lods.length = 0;
    }
}
