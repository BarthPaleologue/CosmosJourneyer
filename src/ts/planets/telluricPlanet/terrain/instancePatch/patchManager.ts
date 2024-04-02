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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ThinInstancePatch } from "./thinInstancePatch";
import { createSquareMatrixBuffer } from "./matrixBuffer";
import { IPatch } from "./iPatch";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

/*export class PatchManager {
    private readonly meshesFromLod: TransformNode[];
    private readonly nbVertexFromLod: number[];
    private readonly patches: [IPatch, number][] = [];

    private patchUpdateRate = 1;

    private readonly computeLodLevel: (patch: IPatch) => number;
    private readonly queue: Array<{ newLOD: number; patch: IPatch }> = [];

    constructor(meshesFromLod: Mesh[], computeLodLevel = (patch: IPatch) => 0) {
        this.meshesFromLod = meshesFromLod;
        this.nbVertexFromLod = this.meshesFromLod.map((mesh) => {
            if (mesh instanceof Mesh) return mesh.getTotalVertices();
            else {
                let count = 0;
                mesh.getChildMeshes().forEach((m) => {
                    if (m instanceof Mesh) count += m.getTotalVertices();
                });
                return count;
            }
        });
        this.computeLodLevel = computeLodLevel;
    }

    public addPatch(patch: IPatch) {
        const lod = this.computeLodLevel(patch);
        this.patches.push([patch, lod]);
        this.queue.push({ newLOD: lod, patch: patch });
    }

    public addPatches(patches: IPatch[]) {
        for (const patch of patches) {
            this.addPatch(patch);
        }
    }

    public removePatch(patch: IPatch) {
        const index = this.patches.findIndex((p) => p[0] === patch);
        if (index === -1) return;
        this.patches.splice(index, 1);

        const queueIndex = this.queue.findIndex((p) => p.patch === patch);
        if (queueIndex === -1) return;
        this.queue.splice(queueIndex, 1);
    }

    public static circleInit(radius: number, patchSize: number, patchResolution: number): ThinInstancePatch[] {
        const patches: ThinInstancePatch[] = [];
        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                const radiusSquared = x * x + z * z;
                if (radiusSquared >= radius * radius) continue;

                const patchPosition = new Vector3(x * patchSize, 0, z * patchSize);
                const patchMatrixBuffer = createSquareMatrixBuffer(patchPosition, patchSize, patchResolution);
                const patch = new ThinInstancePatch(patchPosition, patchMatrixBuffer);

                patches.push(patch);
            }
        }

        return patches;
    }

    public update(playerPosition: Vector3) {
        if (this.meshesFromLod.length > 1) this.updateLOD();
        else this.updateQueue(this.patchUpdateRate);
    }

    private updateLOD() {
        // update LOD
        for (let i = 0; i < this.patches.length; i++) {
            const [patch, patchLod] = this.patches[i];
            const newLod = this.computeLodLevel(patch);
            if (newLod === patchLod) continue;
            this.queue.push({ newLOD: newLod, patch: patch });
            this.patches[i] = [patch, newLod];
        }

        this.updateQueue(this.patchUpdateRate);
    }

    private updateQueue(n: number) {
        // update queue
        for (let i = 0; i < n; i++) {
            const head = this.queue.shift();
            if (head === undefined) break;
            head.patch.createInstances(this.meshesFromLod[head.newLOD]);
        }
    }

    public initInstances() {
        this.updateQueue(this.queue.length);
    }

    public setLodUpdateCadence(cadence: number) {
        this.patchUpdateRate = cadence;
    }

    public getNbInstances() {
        let count = 0;
        for (const [patch] of this.patches) {
            count += patch.getNbInstances();
        }
        return count;
    }

    public getNbVertices() {
        let count = 0;
        for (const [patch, patchLod] of this.patches) {
            count += this.nbVertexFromLod[patchLod] * patch.getNbInstances();
        }
        return count;
    }
}
*/
