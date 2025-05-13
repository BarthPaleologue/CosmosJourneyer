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

import { AbstractEngine, HemisphericLight, Scene, Vector3 } from "@babylonjs/core";

import { DarkKnight } from "../anomalies/darkKnight/darkKnight";
import { generateDarkKnightModel } from "../anomalies/darkKnight/darkKnightModelGenerator";
import { loadTextures } from "../assets/textures";
import { DefaultControls } from "../defaultControls/defaultControls";

export async function createDarkKnightScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const textures = await loadTextures((loadedCount, totalCount, name) => {
        progressCallback(loadedCount / totalCount, `Loading ${name}`);
    }, scene);

    scene.environmentTexture = textures.environment.milkyWay;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();

    // This attaches the camera to the canvas
    camera.attachControl();

    scene.enableDepthRenderer();

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'sphere' shape. Params: name, options, scene
    const darkKnight = new DarkKnight(generateDarkKnightModel([]), scene);

    const scalingFactor = darkKnight.getBoundingRadius();

    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    controls.getTransform().setAbsolutePosition(new Vector3(0, 1, -2).scaleInPlace(scalingFactor));
    controls.getTransform().lookAt(Vector3.Zero());

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);

        const cameraPosition = controls.getTransform().position.clone();

        controls.getTransform().position = Vector3.Zero();
        darkKnight.getTransform().position.subtractInPlace(cameraPosition);
    });

    progressCallback(1, "Rings scene loaded");

    return scene;
}
