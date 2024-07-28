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

import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Matrix } from "@babylonjs/core/Maths/math.vector";
import { Transformable } from "../architecture/transformable";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Textures } from "../assets/textures";

export class StarFieldBox implements Transformable {
    readonly mesh: Mesh;
    readonly material: StandardMaterial;
    readonly texture: CubeTexture;

    constructor(scene: Scene) {
        this.mesh = MeshBuilder.CreateBox("skybox", { size: Number.MAX_SAFE_INTEGER }, scene);

        this.texture = Textures.MILKY_WAY;
        this.texture.setReflectionTextureMatrix(Matrix.Identity());

        this.material = new StandardMaterial("skyboxMat", scene);
        this.material.backFaceCulling = false;
        this.material.disableDepthWrite = true;
        this.material.reflectionTexture = this.texture;
        this.material.reflectionTexture.gammaSpace = true;
        this.material.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        this.material.disableLighting = true;

        this.mesh.material = this.material;
        this.mesh.infiniteDistance = true;

        scene.environmentTexture = this.texture;
    }

    setRotationMatrix(rotationMatrix: Matrix): void {
        this.texture.setReflectionTextureMatrix(rotationMatrix);
    }

    getRotationMatrix(): Matrix {
        return this.texture.getReflectionTextureMatrix();
    }

    getTransform(): TransformNode {
        return this.mesh;
    }

    dispose(): void {
        this.mesh.dispose();
        this.material.dispose();
    }
}
