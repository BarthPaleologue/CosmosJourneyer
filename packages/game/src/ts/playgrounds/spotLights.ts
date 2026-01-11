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

import { ClusteredLightContainer, Color3, FreeCamera, GlowLayer, MeshBuilder, Vector3 } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { ProceduralSpotLightInstances } from "@/frontend/assets/procedural/spotLight";

export function createSpotLightsScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl();

    const groundSize = 200;

    MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, scene);

    const spotLightInstances = new ProceduralSpotLightInstances(Math.PI / 2, 0.3, 10, 3, scene);

    const instanceData: Array<{ rootPosition: Vector3; lookAtTarget: Vector3; upDirection: Vector3; color: Color3 }> =
        [];
    for (let i = 0; i < 1000; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random()) * (groundSize / 2);

        const position = new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        const target = new Vector3(
            (Math.random() - 0.5) * groundSize,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * groundSize,
        );

        const color = Color3.Random();

        instanceData.push({ rootPosition: position, lookAtTarget: target, color, upDirection: Vector3.UpReadOnly });
    }

    spotLightInstances.setInstances(instanceData);

    new ClusteredLightContainer("lightContainer", spotLightInstances.lights, scene);

    new GlowLayer("glow", scene);

    return Promise.resolve(scene);
}
