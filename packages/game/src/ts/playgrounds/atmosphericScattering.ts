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

import { DirectionalLight, MeshBuilder, Vector3 } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { DepthRendererManager } from "@/frontend/helpers/depthRendererManager";
import { lookAt } from "@/frontend/helpers/transform";
import { AtmosphereUniforms } from "@/frontend/postProcesses/atmosphere/atmosphereUniforms";
import { CelestialBodyUberShaderPass } from "@/frontend/postProcesses/celestialBodyUberShader/celestialBodyUberShaderPass";

export function createAtmosphericScatteringScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;

    const scalingFactor = 6_000e3;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    controls.getTransform().setAbsolutePosition(new Vector3(0, 1, -2).scaleInPlace(scalingFactor));
    lookAt(controls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);

    // This attaches the camera to the canvas
    camera.attachControl();

    const depthRendererManager = new DepthRendererManager(scene);

    const light = new DirectionalLight("light1", new Vector3(-1, 0, 0), scene);

    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 * scalingFactor, segments: 64 }, scene);

    const atmosphereUniforms = new AtmosphereUniforms(scalingFactor, 100e3);

    const atmosphere = new CelestialBodyUberShaderPass(
        {
            transform: sphere,
            boundingRadius: scalingFactor,
            emitsLight: false,
        },
        {
            atmosphere: atmosphereUniforms,
            rings: null,
        },
        { stellarObjects: [light], shadowCasters: [] },
        depthRendererManager,
        scene,
    );
    camera.attachPostProcess(atmosphere);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);
    });

    scene.onBeforeCameraRenderObservable.add((camera) => {
        depthRendererManager.setActiveCamera(camera);
    });

    return Promise.resolve(scene);
}
