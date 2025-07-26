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

import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { HyperSpaceTunnel } from "@/frontend/assets/procedural/hyperSpaceTunnel";
import { loadTextures } from "@/frontend/assets/textures";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";

export async function createHyperspaceTunnelDemo(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
) {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const defaultControls = new DefaultControls(scene);

    const camera = defaultControls.getActiveCamera();
    camera.attachControl();

    const textures = await loadTextures(scene, progressMonitor);

    const directionalLight = new DirectionalLight("sun", new Vector3(1, -1, 0), scene);
    directionalLight.intensity = 0.7;

    const hyperSpaceTunnel = new HyperSpaceTunnel(Axis.Z, scene, textures.noises);

    scene.onBeforeRenderObservable.add(() => {
        defaultControls.update(engine.getDeltaTime() / 1000);
        hyperSpaceTunnel.update(engine.getDeltaTime() / 1000);
    });

    return scene;
}
