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

import { Color3, HemisphericLight, MeshBuilder, Vector3 } from "@babylonjs/core";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { DefaultControls } from "../defaultControls/defaultControls";
import { RingsLut } from "../rings/ringsLut";
import { RingsModel } from "../rings/ringsModel";
import { RingsPostProcess } from "../rings/ringsPostProcess";
import { RingsUniforms } from "../rings/ringsUniform";
import { ItemPool } from "../utils/itemPool";

export async function createRingsScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const scalingFactor = 10_000e3;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    controls.getTransform().setAbsolutePosition(new Vector3(0, 5, -10).scaleInPlace(scalingFactor));
    controls.getTransform().lookAt(Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl();

    scene.enableDepthRenderer();

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'sphere' shape. Params: name, options, scene
    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 * scalingFactor, segments: 32 }, scene);

    const ringsLutPool = new ItemPool<RingsLut>(() => new RingsLut(scene));

    const ringsModel: RingsModel = {
        ringStart: 1.7,
        ringEnd: 3.5,
        ringFrequency: 5,
        ringOpacity: 0.9,
        ringColor: Color3.White(),
        seed: 0,
    };

    const ringsUniforms = new RingsUniforms(ringsModel, 0, ringsLutPool, scene);

    await new Promise<void>((resolve) => {
        ringsUniforms.lut.getTexture().executeWhenReady(() => {
            resolve();
        });
    });

    const rings = new RingsPostProcess(sphere, ringsUniforms, { name: "Sphere", radius: 1 * scalingFactor }, [], scene);
    camera.attachPostProcess(rings);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);

        const cameraPosition = controls.getTransform().position.clone();

        controls.getTransform().position = Vector3.Zero();
        sphere.position.subtractInPlace(cameraPosition);
    });

    progressCallback(1, "Rings scene loaded");

    return scene;
}
