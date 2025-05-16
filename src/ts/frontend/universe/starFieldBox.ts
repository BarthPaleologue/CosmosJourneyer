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

import { BackgroundMaterial } from "@babylonjs/core/Materials/Background/backgroundMaterial";
import { Material } from "@babylonjs/core/Materials/material";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Matrix } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { RenderingManager } from "@babylonjs/core/Rendering/renderingManager";
import { Scene } from "@babylonjs/core/scene";

import { Transformable } from "@/frontend/universe/architecture/transformable";

export class StarFieldBox implements Transformable {
    readonly mesh: Mesh;
    readonly material: Material;
    readonly texture: CubeTexture;

    constructor(texture: CubeTexture, scene: Scene) {
        RenderingManager.MIN_RENDERINGGROUPS = Math.min(-1, RenderingManager.MIN_RENDERINGGROUPS);

        this.mesh = MeshBuilder.CreateBox("skybox", { size: 1000e3 }, scene);
        this.mesh.renderingGroupId = -1;

        this.texture = texture;
        this.texture.setReflectionTextureMatrix(Matrix.Identity());

        const material = new BackgroundMaterial("skyboxMat", scene);
        material.backFaceCulling = false;
        material.reflectionTexture = this.texture;
        material.reflectionTexture.gammaSpace = true;
        material.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        material.disableDepthWrite = true;

        this.material = material;

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
