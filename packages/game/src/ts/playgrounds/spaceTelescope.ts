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

import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadEnvironmentTextures } from "@/frontend/assets/textures/environment";
import { DepthRendererManager } from "@/frontend/helpers/depthRendererManager";

import { SpaceTelescope } from "@/modules/spaceTelescopes/spaceTelescope";
import { createSpaceTelescopeModel } from "@/modules/spaceTelescopes/spaceTelescopeModel";

import { enablePhysics, enableShadows } from "./utils";

export async function createSpaceTelescopeScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;
    await enablePhysics(scene);
    const textures = await loadEnvironmentTextures(scene, progressMonitor);
    scene.environmentTexture = textures.milkyWay;
    scene.createDefaultSkybox(textures.milkyWay, true, 10_000, 0);
    const model = createSpaceTelescopeModel();
    const telescope = new SpaceTelescope(model, scene);
    // Present the native Y-up geometry with the prototype's camera framing.
    telescope.getTransform().rotation.z = 0;
    const light = new DirectionalLight("telescopeLight", new Vector3(-1, -2, 1).normalize(), scene);
    light.position.set(200, 400, -200);
    const view = new URLSearchParams(window.location.search).get("view");
    const target = view === "mirror" ? Vector3.Zero() : new Vector3(0, -35, 0);
    const distance = view === "mirror" ? 55 : telescope.radius * 2.5;
    const camera = new ArcRotateCamera("telescopeCamera", -Math.PI / 2.5, Math.PI / 3, distance, target, scene);
    if (view === "shields") {
        camera.beta = Math.PI * 0.6;
    }
    camera.minZ = 0.1;
    camera.maxZ = 100_000;
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 50_000;
    camera.wheelDeltaPercentage = 0.01;
    camera.attachControl();
    scene.onBeforeRenderObservable.add(() => {
        telescope.update(camera.globalPosition);
    });
    const depthRenderers = new DepthRendererManager(scene);
    enableShadows(light, depthRenderers, {
        maxZ: telescope.radius * 4,
        cascadeCount: 4,
        resolution: 2048,
    });
    scene.onDisposeObservable.addOnce(() => {
        depthRenderers.dispose();
        telescope.dispose();
    });
    return scene;
}
