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

import { FreeCamera, Scene, Vector3 } from "@babylonjs/core";
import type { AbstractEngine } from "@babylonjs/core";

import { getSunModel } from "@/backend/universe/customSystems/sol/sun";

import { DefaultControls } from "@/frontend/gameplay/controls/defaultControls/defaultControls";
import { DepthRendererManager } from "@/frontend/helpers/depthRendererManager";
import { lookAt } from "@/frontend/helpers/transform";
import type { ILoadingProgressMonitor } from "@/frontend/presentation/assets/loadingProgressMonitor";
import { loadTextures } from "@/frontend/presentation/assets/textures";
import { LensFlarePostProcess } from "@/frontend/presentation/postProcesses/lensFlarePostProcess";
import { VolumetricLight } from "@/frontend/presentation/postProcesses/volumetricLight/volumetricLight";
import { StarFieldBox } from "@/frontend/presentation/starFieldBox";
import { Star } from "@/frontend/simulation/stellarObjects/star/star";

import { enablePhysics } from "../utils";

export async function createSunScene(engine: AbstractEngine, progressMonitor: ILoadingProgressMonitor): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;
    scene.clearColor.set(0, 0, 0, 1);

    await enablePhysics(scene);

    const textures = await loadTextures(scene, progressMonitor);

    const scalingFactor = 6_000e3 * 150;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    const depthRendererManager = new DepthRendererManager(scene);

    controls.getTransform().setAbsolutePosition(new Vector3(0, 2, -2).scaleInPlace(scalingFactor));
    lookAt(controls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);

    // This is a fix for E2E testing: the starfield box does not render correctly if the camera target is zero
    if (camera instanceof FreeCamera) {
        camera.setTarget(new Vector3(-1e-3, 0, -1e-1));
    }

    // This attaches the camera to the canvas
    camera.attachControl();

    const starField = new StarFieldBox(textures.environment.milkyWay, 1000e3, scene);

    const sunModel = getSunModel();

    const sun = new Star(sunModel, textures, scene);

    const volumetricLight = new VolumetricLight(sun.mesh, sun.volumetricLightUniforms, [starField.mesh], scene);
    camera.attachPostProcess(volumetricLight);

    const lensFlare = new LensFlarePostProcess(
        sun.getTransform(),
        sun.getBoundingRadius(),
        sun.getEmissiveColor(),
        depthRendererManager,
        scene,
    );
    camera.attachPostProcess(lensFlare);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);

        sun.updateMaterial(deltaSeconds);
    });

    return scene;
}
