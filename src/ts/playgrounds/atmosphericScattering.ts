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

import { Color4, MeshBuilder, PointLight, Vector3 } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { type AtmosphereModel } from "@/backend/universe/orbitalObjects/atmosphereModel";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { AtmosphereUniforms } from "@/frontend/postProcesses/atmosphere/atmosphereUniforms";
import { AtmosphericScatteringPostProcess } from "@/frontend/postProcesses/atmosphere/atmosphericScatteringPostProcess";
import { lookAt } from "@/frontend/uberCore/transforms/basicTransform";

export function createAtmosphericScatteringScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const scalingFactor = 6_000e3;
    const earthMass = 5.972e24; // kg

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    controls.getTransform().setAbsolutePosition(new Vector3(0, 1, -2).scaleInPlace(scalingFactor));
    lookAt(controls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);

    // This attaches the camera to the canvas
    camera.attachControl();

    const depthRenderer = scene.enableDepthRenderer(camera, true, true);
    depthRenderer.clearColor = new Color4(0, 0, 0, 1);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new PointLight("light1", new Vector3(10 * scalingFactor, 0, 0), scene);

    // Our built-in 'sphere' shape. Params: name, options, scene
    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 * scalingFactor, segments: 64 }, scene);

    const atmosphereModel: AtmosphereModel = {
        seaLevelPressure: 101325, // Sea level pressure in Pascals
        greenHouseEffectFactor: 0.5, // Arbitrary value for greenhouse effect
        gasMix: [
            ["N2", 0.78], // Nitrogen
            ["O2", 0.21], // Oxygen
            ["Ar", 0.01], // Argon
        ],
    };

    const atmosphereUniforms = new AtmosphereUniforms(scalingFactor, earthMass, 298, atmosphereModel);

    const atmosphere = new AtmosphericScatteringPostProcess(sphere, scalingFactor, atmosphereUniforms, [light], scene);
    camera.attachPostProcess(atmosphere);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);

        const cameraPosition = controls.getTransform().position.clone();

        controls.getTransform().position = Vector3.Zero();
        sphere.position.subtractInPlace(cameraPosition);
    });

    return Promise.resolve(scene);
}
