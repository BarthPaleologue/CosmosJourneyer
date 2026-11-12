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

import { CreateIcoSphere, DirectionalLight, Quaternion, Vector3 } from "@babylonjs/core";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { degreesToRadians } from "@cosmos-journeyer/physics";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { DepthRendererManager } from "@/frontend/helpers/depthRendererManager";
import { AtmosphereUniforms } from "@/frontend/postProcesses/atmosphere/atmosphereUniforms";
import { CelestialBodyUberShaderPass } from "@/frontend/postProcesses/celestialBodyUberShader/celestialBodyUberShaderPass";

import { Aurora } from "@/modules/aurora/aurora";

import { enablePointerLock } from "./utils";

/**
 * @param engine - Rendering engine.
 * @param progressMonitor - Asset-loading progress.
 * @returns Aurora PG scene.
 */
export async function createAuroraScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.clearColor.set(0, 0, 0, 1);
    scene.useRightHandedSystem = true;

    const planetRadius = 1000e3;

    const controls = new DefaultControls(scene);
    controls.speed = 500e3;
    controls.getTransform().setAbsolutePosition(new Vector3(-320.5e3, 950.3e3, 187.3e3));
    controls.getTransform().rotationQuaternion = Quaternion.RotationAxis(
        new Vector3(0.395, -0.87, 0.295).normalize(),
        degreesToRadians(60),
    );

    const camera = controls.getActiveCamera();
    camera.minZ = 1e3;
    camera.maxZ = 40_000e3;
    camera.attachControl();

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new DirectionalLight("light1", new Vector3(0, 0, 1), scene);
    light.intensity = 0.7;

    const planet = CreateIcoSphere("Planet", { radius: planetRadius, subdivisions: 9 }, scene);

    const depthRendererManager = new DepthRendererManager(scene);
    const atmosphere = new CelestialBodyUberShaderPass(
        {
            transform: planet,
            boundingRadius: planetRadius,
            emitsLight: false,
        },
        {
            atmosphere: new AtmosphereUniforms(planetRadius, 100e3),
            rings: null,
        },
        { stellarObjects: [light], shadowCasters: [] },
        depthRendererManager,
        scene,
    );
    camera.attachPostProcess(atmosphere);

    const aurora = new Aurora(planetRadius, scene);
    aurora.getTransform().parent = planet;

    enablePointerLock(engine);

    scene.onBeforeRenderObservable.add(() => {
        controls.update(engine.getDeltaTime() / 1000);
    });

    scene.onBeforeCameraRenderObservable.add((activeCamera) => {
        depthRendererManager.setActiveCamera(activeCamera);
    });

    return Promise.resolve(scene);
}
