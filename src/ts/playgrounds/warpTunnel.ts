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

import { FreeCamera, MeshBuilder, Vector3 } from "@babylonjs/core";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { WarpTunnel } from "@/frontend/assets/procedural/warpTunnel";

import { enablePhysics } from "./utils";

export async function createWarpTunnelScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const freeCamera = new FreeCamera("FreeCamera", new Vector3(0, 0, 0), scene);
    freeCamera.attachControl();

    await enablePhysics(scene);

    const anchor = MeshBuilder.CreateBox("Anchor", { size: 10 }, scene);
    anchor.position.z = 200;

    const warpTunnel = new WarpTunnel(anchor, scene);
    warpTunnel.setThrottle(1);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        warpTunnel.update(deltaSeconds);
    });

    progressCallback(1, "Warp tunnel scene loaded");

    return scene;
}
