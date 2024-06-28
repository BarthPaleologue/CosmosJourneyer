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
import { Transformable } from "../architecture/transformable";

export class AsteroidPatch implements IPatch, Transformable {
    private baseMesh: Mesh | null = null;
    readonly matrixBuffer: Float32Array;

    constructor(matrixBuffer: Float32Array) {
        this.matrixBuffer = matrixBuffer;
    }

    public clearInstances(): void {
        if (this.baseMesh === null) return;
        this.baseMesh.thinInstanceCount = 0;
        this.baseMesh.dispose();
        this.baseMesh = null;
    }

    public createInstances(baseMesh: TransformNode): void {
        this.clearInstances();
        if (!(baseMesh instanceof Mesh)) {
            throw new Error("Tried to create instances from a non-mesh object. Try using HierarchyInstancePatch instead if you want to use a TransformNode.");
        }
        this.baseMesh = baseMesh.clone();
        this.baseMesh.makeGeometryUnique();

        this.baseMesh.isVisible = true;
        this.baseMesh.thinInstanceSetBuffer("matrix", this.matrixBuffer, 16, false);
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

    public getTransform(): TransformNode {
        if(this.baseMesh === null) {
            throw new Error("Patch is not instanciated, the baseMesh is null!");
        }
        return this.baseMesh;
    }

    public dispose() {
        this.clearInstances();
        if (this.baseMesh !== null) this.baseMesh.dispose();
    }
}
