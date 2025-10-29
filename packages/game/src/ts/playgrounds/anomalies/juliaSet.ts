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

import { ArcRotateCamera, Scene, Vector3, type AbstractEngine } from "@babylonjs/core";

import { newSeededJuliaSetModel } from "@/backend/universe/proceduralGenerators/anomalies/juliaSetModelGenerator";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { JuliaSetPostProcess } from "@/frontend/postProcesses/anomalies/juliaSetPostProcess";
import { EmptyCelestialBody } from "@/frontend/universe/emptyCelestialBody";

export function createJuliaSetScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;

    const urlParams = new URLSearchParams(window.location.search);

    const camera = new ArcRotateCamera("ArcRotateCamera", 0, 3.14 / 3, 3000e3, Vector3.Zero(), scene);
    camera.attachControl();
    camera.wheelPrecision /= 30e3;
    camera.maxZ = 10e7;

    const depthRenderer = scene.enableDepthRenderer(null, false, true);

    const model = newSeededJuliaSetModel(
        "juliaSet",
        Number(urlParams.get("seed") ?? Math.random() * 100_000),
        "Julia Set",
        [],
    );

    const anomaly = new EmptyCelestialBody(model, scene);

    const pp = new JuliaSetPostProcess(
        anomaly.getTransform(),
        anomaly.getBoundingRadius(),
        model.accentColor,
        scene,
        [],
    );

    scene.cameras.forEach((camera) => camera.attachPostProcess(pp));
    scene.onNewCameraAddedObservable.add((camera) => {
        camera.attachPostProcess(pp);
    });

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        pp.update(deltaSeconds);
    });

    scene.onBeforeCameraRenderObservable.add((camera) => {
        depthRenderer.getDepthMap().activeCamera = camera;
    });

    return Promise.resolve(scene);
}
