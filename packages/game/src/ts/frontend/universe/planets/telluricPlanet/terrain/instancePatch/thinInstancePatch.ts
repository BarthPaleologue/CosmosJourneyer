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

import "@babylonjs/core/Meshes/thinInstanceMesh";

import { type Mesh } from "@babylonjs/core/Meshes/mesh";

import { type IPatch } from "./iPatch";

export class ThinInstancePatch implements IPatch {
    readonly matrixBuffer: Float32Array;

    private currentLod: { mesh: Mesh; lodIndex: number } | null = null;
    private readonly lods: { mesh: Mesh; distance: number }[] = [];

    constructor(matrixBuffer: Float32Array) {
        this.matrixBuffer = matrixBuffer;
    }

    public clearInstances(): void {
        if (this.currentLod === null) return;
        const currentMesh = this.currentLod.mesh;
        currentMesh.thinInstanceCount = 0;
        this.currentLod = null;
    }

    public createInstances(baseMeshes: { mesh: Mesh; distance: number }[]): void {
        this.clearInstances();
        this.lods.length = 0;
        for (const baseMesh of baseMeshes) {
            const lodMesh = baseMesh.mesh.clone();
            lodMesh.makeGeometryUnique();
            lodMesh.isVisible = true;
            lodMesh.alwaysSelectAsActiveMesh = true;
            this.lods.push({ mesh: lodMesh, distance: baseMesh.distance });
        }

        const currentLod = this.lods.at(0);
        if (currentLod === undefined) throw new Error("No lod mesh was set.");
        this.currentLod = { mesh: currentLod.mesh, lodIndex: 0 };
        this.sendToGPU();
    }

    private sendToGPU() {
        if (this.currentLod === null) throw new Error("Tried to send matrix buffer to GPU but no base mesh was set.");
        this.currentLod.mesh.thinInstanceSetBuffer("matrix", this.matrixBuffer, 16, false);
    }

    public getNbInstances(): number {
        if (this.currentLod === null) return 0;
        return this.currentLod.mesh.thinInstanceCount;
    }

    public setEnabled(enabled: boolean) {
        if (this.currentLod === null) return;
        this.currentLod.mesh.setEnabled(enabled);
    }

    public isEnabled(): boolean {
        if (this.currentLod === null) return false;
        return this.currentLod.mesh.isEnabled();
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

    public dispose() {
        this.clearInstances();
        this.lods.forEach((lod) => {
            lod.mesh.dispose();
        });
        this.lods.length = 0;
    }
}
