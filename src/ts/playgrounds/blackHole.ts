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

import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { newSeededBlackHoleModel } from "@/backend/universe/proceduralGenerators/stellarObjects/blackHoleModelGenerator";

import { loadTextures } from "@/frontend/assets/textures";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { translate } from "@/frontend/uberCore/transforms/basicTransform";
import { StarFieldBox } from "@/frontend/universe/starFieldBox";
import { BlackHole } from "@/frontend/universe/stellarObjects/blackHole/blackHole";
import { BlackHolePostProcess } from "@/frontend/universe/stellarObjects/blackHole/blackHolePostProcess";

import { enablePhysics } from "./utils";

export async function createBlackHoleScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    const textures = await loadTextures((loadedCount, totalCount) => {
        progressCallback(loadedCount / totalCount, "Loading textures");
    }, scene);

    const defaultControls = new DefaultControls(scene);
    defaultControls.speed = 2000000;

    const camera = defaultControls.getActiveCamera();
    camera.attachControl();

    scene.activeCamera = camera;

    scene.enableDepthRenderer(camera, false, true);

    new StarFieldBox(textures.environment.milkyWay, scene);

    const blackHoleModel = newSeededBlackHoleModel("blackHole", 42, "Black Hole Demo", []);
    const blackHole = new BlackHole(blackHoleModel, textures.environment.milkyWay, scene);
    blackHole.getTransform().position = new Vector3(0, -0.2, 1).scaleInPlace(blackHole.getRadius() * 20);

    const blackHolePostProcess = new BlackHolePostProcess(blackHole.getTransform(), blackHole.blackHoleUniforms, scene);
    camera.attachPostProcess(blackHolePostProcess);

    camera.maxZ = 1e12;
    defaultControls.getTransform().lookAt(blackHole.getTransform().position);

    scene.onBeforePhysicsObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        const displacement = defaultControls.update(deltaSeconds);

        translate(defaultControls.getTransform(), displacement.negate());
        translate(blackHole.getTransform(), displacement.negate());

        blackHolePostProcess.update(deltaSeconds);
    });

    document.addEventListener("click", async () => {
        if (document.pointerLockElement === null) {
            await defaultControls.getActiveCamera().getEngine().getRenderingCanvas()?.requestPointerLock();
        }
    });

    progressCallback(1, "Black Hole Scene Loaded");

    return scene;
}
