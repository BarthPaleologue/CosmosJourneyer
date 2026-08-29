//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { ClusteredLightContainer, DirectionalLight, GlowLayer, Scene, Vector3 } from "@babylonjs/core";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { getBoundingRadius } from "@/frontend/helpers/boundingRadius";
import { initializeCsg2 } from "@/frontend/helpers/csg2";
import { lookAt } from "@/frontend/helpers/transform";
import { Uplink, UplinkState } from "@/frontend/persistentEntities/uplink";

import { addToWindow } from "./utils";

export async function createUplinkScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    new DirectionalLight("ambientLight", Vector3.Down(), scene);

    await initializeCsg2();

    const model = { type: "uplink" } as const;
    const uplink = new Uplink(model, scene);
    uplink.setState(UplinkState.SCANNING);
    const boundingRadius = getBoundingRadius(uplink.getTransform());

    new ClusteredLightContainer("clusteredLights", uplink.lights, scene);

    const controls = new DefaultControls(scene);
    controls.speed = boundingRadius;
    controls.getTransform().position.copyFromFloats(0, 0, 1.5 * boundingRadius);
    lookAt(controls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);

    const camera = controls.getActiveCamera();
    camera.maxZ = 10 * boundingRadius;
    camera.attachControl();

    new GlowLayer("glowLayer", scene);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;

        controls.update(deltaSeconds);
        uplink.update(deltaSeconds);
    });

    addToWindow("uplink", uplink);

    return Promise.resolve(scene);
}
