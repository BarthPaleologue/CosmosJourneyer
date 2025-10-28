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

import { Scene, Vector3, type AbstractEngine } from "@babylonjs/core";

import { generateDarkKnightModel } from "@/backend/universe/proceduralGenerators/anomalies/darkKnightModelGenerator";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadEnvironmentTextures } from "@/frontend/assets/textures/environment";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { lookAt } from "@/frontend/helpers/transform";
import { DarkKnight } from "@/frontend/universe/darkKnight";
import { StarFieldBox } from "@/frontend/universe/starFieldBox";

export async function createDarkKnightScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;

    const textures = await loadEnvironmentTextures(scene, progressMonitor);

    new StarFieldBox(textures.milkyWay, 1000e3, scene);

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();

    // This attaches the camera to the canvas
    camera.attachControl();

    scene.enableDepthRenderer();

    // Our built-in 'sphere' shape. Params: name, options, scene
    const darkKnight = new DarkKnight(generateDarkKnightModel([]), scene);

    const scalingFactor = darkKnight.getBoundingRadius();

    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    controls.getTransform().setAbsolutePosition(new Vector3(0, 1, -2).scaleInPlace(scalingFactor));
    lookAt(controls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);
    });

    return scene;
}
