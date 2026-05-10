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

import {
    CascadedShadowGenerator,
    Color3,
    DirectionalLight,
    FreeCamera,
    Matrix,
    MeshBuilder,
    PBRMetallicRoughnessMaterial,
    Quaternion,
    Vector3,
} from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";

import { enablePhysics } from "./utils";

export async function createForestScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const camera = new FreeCamera("camera", new Vector3(0, 5, -10), scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl();

    const sun = new DirectionalLight("sun", new Vector3(-1, -2, -1), scene);

    const groundSize = 200;

    const ground = MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, scene);
    ground.receiveShadows = true;
    const groundMaterial = new PBRMetallicRoughnessMaterial("groundMaterial", scene);
    groundMaterial.baseColor = Color3.FromHexString("#1a8c1a");
    groundMaterial.metallic = 0;
    groundMaterial.roughness = 1;
    ground.material = groundMaterial;

    await enablePhysics(scene);

    const assets = await loadRenderingAssets(scene, progressMonitor);

    const treeBase = assets.objects.tree.clone("TreeTemplate");
    treeBase.isVisible = true;

    const instanceCount = 100;
    const instanceBuffer = new Float32Array(instanceCount * 16);
    for (let i = 0; i < instanceCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random()) * (groundSize / 2);

        const position = new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        const rotation = Vector3.Up().scale(angle);
        const scaling = Vector3.One().scale(0.5 + Math.random());

        const matrix = Matrix.Compose(scaling, Quaternion.FromEulerVector(rotation), position);
        matrix.copyToArray(instanceBuffer, i * 16);
    }

    treeBase.thinInstanceSetBuffer("matrix", instanceBuffer, 16, false);

    const csm = new CascadedShadowGenerator(2048, sun);
    csm.shadowMaxZ = 400;
    csm.addShadowCaster(treeBase);

    return scene;
}
