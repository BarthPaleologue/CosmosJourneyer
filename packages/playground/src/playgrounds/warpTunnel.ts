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

import { MeshBuilder } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { WarpTunnel } from "@/frontend/assets/procedural/warpTunnel";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";

import { enablePhysics } from "./utils";

export async function createWarpTunnelScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();

    await enablePhysics(scene);

    const anchor = MeshBuilder.CreateBox("Anchor", { size: 10 }, scene);
    anchor.position.z = 200;

    const warpTunnel = new WarpTunnel(scene);
    warpTunnel.setThrottle(1);

    warpTunnel.getTransform().parent = anchor;

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        warpTunnel.update(deltaSeconds);

        controls.update(deltaSeconds);

        const anchorDisplacement = 2000;
        anchor.position.z -= anchorDisplacement * deltaSeconds;
        controls.getTransform().position.z -= anchorDisplacement * deltaSeconds;

        const cameraPosition = camera.globalPosition;
        anchor.position.subtractInPlace(cameraPosition);

        controls.getTransform().position.subtractInPlace(cameraPosition);
    });

    return scene;
}
