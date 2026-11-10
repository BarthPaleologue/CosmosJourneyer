//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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
    ArcRotateCamera,
    Color3,
    DirectionalLight,
    HemisphericLight,
    MeshBuilder,
    PBRMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    Vector3,
} from "@babylonjs/core";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { ModuleAssets } from "@/frontend/assets/moduleAssets";
import { loadAssetInContainerAsync } from "@/frontend/assets/objects/utils";

import teapotPath from "@/modules/russellTeaPot/assets/teapot.glb";
import { RussellTeaPot } from "@/modules/russellTeaPot/russellTeaPot";
import { russellTeapotAssetId } from "@/modules/russellTeaPot/russellTeaPotModel";
import { CollisionMask } from "@/settings";

import { createSky, enablePhysics } from "./utils";

/**
 * @param engine - Rendering engine.
 * @param progressMonitor - Asset-loading progress.
 * @returns Scene for inspecting the Russell teapot model and its collision shape.
 */
export async function createTeapotScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene, new Vector3(0, -9.81, 0));

    const sun = new DirectionalLight("sun", new Vector3(-1, -2, -1), scene);
    createSky(sun.direction.scale(-1), scene);

    const ambient = new HemisphericLight("ambient", Vector3.Up(), scene);
    ambient.intensity = 0.3;

    const container = await loadAssetInContainerAsync("RussellTeaPot", teapotPath, scene, progressMonitor);
    const moduleAssets = new ModuleAssets([[russellTeapotAssetId, container]]);

    const teapotResult = RussellTeaPot.New(moduleAssets);
    if (!teapotResult.success) {
        throw new Error(teapotResult.error.message);
    }
    const teapot = teapotResult.value;
    const teapotTransform = teapot.getTransform();

    const initialBounds = teapotTransform.getHierarchyBoundingVectors();
    teapotTransform.position.y = -initialBounds.min.y;
    teapot.update(teapotTransform.getAbsolutePosition());

    const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
    const groundMaterial = new PBRMaterial("groundMaterial", scene);
    groundMaterial.albedoColor = new Color3(0.25, 0.27, 0.3);
    groundMaterial.metallic = 0;
    groundMaterial.roughness = 0.8;
    ground.material = groundMaterial;

    const groundAggregate = new PhysicsAggregate(
        ground,
        PhysicsShapeType.BOX,
        { mass: 0, restitution: 0.2, friction: 0.8 },
        scene,
    );
    groundAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;

    const bounds = teapotTransform.getHierarchyBoundingVectors();
    const center = bounds.min.add(bounds.max).scale(0.5);
    const size = bounds.max.subtract(bounds.min);
    const maxDimension = Math.max(size.x, size.y, size.z);

    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, maxDimension * 3, center, scene);
    camera.lowerRadiusLimit = maxDimension;
    camera.upperRadiusLimit = maxDimension * 20;
    camera.wheelPrecision = 100;
    camera.minZ = 0.01;
    camera.attachControl();

    scene.onBeforeRenderObservable.add(() => {
        teapot.update(camera.globalPosition);
    });

    return scene;
}
