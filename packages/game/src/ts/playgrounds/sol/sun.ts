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

import { FreeCamera, Scene, Vector3, type AbstractEngine } from "@babylonjs/core";

import { getSunModel } from "@/backend/universe/customSystems/sol/sun";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadTextures } from "@/frontend/assets/textures";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { lookAt } from "@/frontend/helpers/transform";
import { LensFlarePostProcess } from "@/frontend/postProcesses/lensFlarePostProcess";
import { VolumetricLight } from "@/frontend/postProcesses/volumetricLight/volumetricLight";
import { StarFieldBox } from "@/frontend/universe/starFieldBox";
import { Star } from "@/frontend/universe/stellarObjects/star/star";

import { enablePhysics } from "../utils";

export async function createSunScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.clearColor.set(0, 0, 0, 1);

    await enablePhysics(scene);

    const textures = await loadTextures(scene, progressMonitor);

    const scalingFactor = 6_000e3 * 150;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    scene.enableDepthRenderer(camera, false, true);

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
        sun.getLight().diffuse,
        scene,
    );
    camera.attachPostProcess(lensFlare);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);

        sun.updateMaterial(deltaSeconds);

        const cameraPosition = controls.getTransform().position.clone();

        controls.getTransform().position = Vector3.Zero();
        sun.getTransform().position.subtractInPlace(cameraPosition);
    });

    return scene;
}
