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

import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

import type { SystemContent } from "@/frontend/systemEntity/systemEntity";

export class DarkKnight implements SystemContent {
    readonly radius: number;

    private readonly mesh: Mesh;

    private readonly material: PBRMetallicRoughnessMaterial;

    constructor(scene: Scene) {
        this.radius = 100e3;

        this.mesh = MeshBuilder.CreateSphere("DarkKnight", { diameter: this.radius * 2, segments: 256 }, scene);

        this.material = new PBRMetallicRoughnessMaterial("DarkKnightMaterial", scene);
        this.material.metallic = 1;
        this.material.roughness = 0.0;
        this.material.disableLighting = true;

        this.mesh.material = this.material;
    }

    getTransform(): TransformNode {
        return this.mesh;
    }

    dispose(): void {
        this.mesh.dispose();
    }
}
