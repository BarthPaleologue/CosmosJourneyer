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
import type { Material } from "@babylonjs/core/Materials/material";
import { type CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Matrix } from "@babylonjs/core/Maths/math.vector";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { RenderingManager } from "@babylonjs/core/Rendering/renderingManager";
import { type Scene } from "@babylonjs/core/scene";

import { type Transformable } from "@/frontend/universe/architecture/transformable";

export class StarFieldBox implements Transformable {
    readonly mesh: Mesh;
    readonly material: Material;
    readonly texture: CubeTexture;
    readonly clonedTexture: CubeTexture;

    constructor(texture: CubeTexture, scale: number, scene: Scene) {
        RenderingManager.MIN_RENDERINGGROUPS = Math.min(-1, RenderingManager.MIN_RENDERINGGROUPS);

        scene.environmentTexture = texture;

        this.mesh = MeshBuilder.CreateBox("skybox", { size: scale }, scene);
        this.mesh.renderingGroupId = -1;

        this.texture = texture;
        this.texture.setReflectionTextureMatrix(Matrix.Identity());

        this.clonedTexture = this.texture.clone();
        this.clonedTexture.coordinatesMode = Texture.SKYBOX_MODE;

        const material = new BackgroundMaterial("skyboxMat", scene);
        material.reflectionTexture = this.clonedTexture;
        material.backFaceCulling = false;
        material.disableDepthWrite = true;

        this.material = material;
        this.mesh.material = this.material;

        this.mesh.isPickable = false;
        this.mesh.ignoreCameraMaxZ = true;
        this.mesh.infiniteDistance = true;
    }

    setRotationMatrix(rotationMatrix: Matrix): void {
        this.texture.setReflectionTextureMatrix(rotationMatrix);
        this.clonedTexture.setReflectionTextureMatrix(rotationMatrix);
    }

    getTransform(): TransformNode {
        return this.mesh;
    }

    dispose(): void {
        this.material.dispose();
        this.getTransform().dispose();
    }
}
