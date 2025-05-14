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

import { MeshBuilder, PointLight, Vector3 } from "@babylonjs/core";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { AtmosphereUniforms } from "../atmosphere/atmosphereUniforms";
import { AtmosphericScatteringPostProcess } from "../atmosphere/atmosphericScatteringPostProcess";
import { DefaultControls } from "../defaultControls/defaultControls";

export function createAtmosphericScatteringScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const scalingFactor = 6_000e3;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    controls.getTransform().setAbsolutePosition(new Vector3(0, 1, -2).scaleInPlace(scalingFactor));
    controls.getTransform().lookAt(Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl();

    scene.enableDepthRenderer(null, false, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new PointLight("light1", new Vector3(10 * scalingFactor, 0, 0), scene);

    // Our built-in 'sphere' shape. Params: name, options, scene
    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 * scalingFactor, segments: 64 }, scene);

    const atmosphereUniforms = new AtmosphereUniforms(scalingFactor, 100e3);

    const atmosphere = new AtmosphericScatteringPostProcess(sphere, scalingFactor, atmosphereUniforms, [light], scene);
    camera.attachPostProcess(atmosphere);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);

        const cameraPosition = controls.getTransform().position.clone();

        controls.getTransform().position = Vector3.Zero();
        sphere.position.subtractInPlace(cameraPosition);
    });

    progressCallback(1, "Rings scene loaded");

    return Promise.resolve(scene);
}
