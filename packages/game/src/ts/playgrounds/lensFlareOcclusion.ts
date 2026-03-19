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
    Color3,
    FreeCamera,
    MeshBuilder,
    Scene,
    StandardMaterial,
    TransformNode,
    Vector3,
    type AbstractEngine,
} from "@babylonjs/core";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { LensFlarePostProcess } from "@/frontend/postProcesses/lensFlarePostProcess";

import { CollisionMask } from "@/settings";

import { enablePhysics } from "./utils";

const SOURCE_POSITION = new Vector3(120, 0, 220);
const OCCLUDER_POSITIONS = {
    "not-occluded": new Vector3(180, 0, 110),
    "partially-occluded": new Vector3(66.15, 0, 110),
    occluded: new Vector3(60, 0, 110),
} as const;

export async function createLensFlareOcclusionScene(
    engine: AbstractEngine,
    _progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;
    scene.clearColor.set(0.002, 0.002, 0.01, 1);

    await enablePhysics(scene);

    const camera = new FreeCamera("lensFlareOcclusionCamera", Vector3.Zero(), scene);
    camera.minZ = 0.1;
    camera.maxZ = 1000;
    camera.position = new Vector3(0, 0, 0);
    camera.setTarget(new Vector3(0, 0, 240));
    camera.attachControl();
    scene.activeCamera = camera;
    scene.enableDepthRenderer(camera, false, true);

    const flareTarget = new TransformNode("lensFlareOcclusionTarget", scene);
    flareTarget.position.copyFrom(SOURCE_POSITION);

    const sourceMesh = MeshBuilder.CreateSphere("lensFlareOcclusionSource", { diameter: 8, segments: 32 }, scene);
    sourceMesh.parent = flareTarget;
    const sourceMaterial = new StandardMaterial("lensFlareOcclusionSourceMaterial", scene);
    sourceMaterial.disableLighting = true;
    sourceMaterial.emissiveColor = new Color3(1.0, 0.92, 0.68);
    sourceMaterial.diffuseColor = Color3.Black();
    sourceMesh.material = sourceMaterial;

    const occluder = MeshBuilder.CreateBox("lensFlareOcclusionOccluder", { width: 10, height: 24, depth: 4 }, scene);
    const occluderMaterial = new StandardMaterial("lensFlareOcclusionOccluderMaterial", scene);
    occluderMaterial.disableLighting = true;
    occluderMaterial.emissiveColor = new Color3(0.03, 0.04, 0.08);
    occluderMaterial.diffuseColor = new Color3(0.03, 0.04, 0.08);
    occluder.material = occluderMaterial;

    const urlParams = new URLSearchParams(window.location.search);
    const occlusion = urlParams.get("occlusion") ?? "partially-occluded";
    if (!(occlusion in OCCLUDER_POSITIONS)) {
        throw new Error(`Unknown lens flare occlusion mode: ${occlusion}`);
    }
    occluder.position.copyFrom(OCCLUDER_POSITIONS[occlusion as keyof typeof OCCLUDER_POSITIONS]);

    const occluderAggregate = new PhysicsAggregate(occluder, PhysicsShapeType.BOX, { mass: 0 }, scene);
    occluderAggregate.body.disablePreStep = false;
    occluderAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
    occluderAggregate.shape.filterCollideMask = CollisionMask.SUN_OCCLUSION_QUERY;

    const lensFlare = new LensFlarePostProcess(flareTarget, 5, new Color3(1.0, 0.92, 0.68), scene);
    camera.attachPostProcess(lensFlare);

    let frameCounter = 0;
    scene.onAfterRenderObservable.add(() => {
        frameCounter++;
        if (frameCounter === 8) {
            scene.getEngine().getRenderingCanvas()?.setAttribute("data-lens-flare-occlusion-ready", "1");
        }
    });

    return scene;
}
