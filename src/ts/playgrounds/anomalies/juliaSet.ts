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

import { AbstractEngine, ArcRotateCamera, Scene, Vector3 } from "@babylonjs/core";

import { newSeededJuliaSetModel } from "@/backend/universe/proceduralGenerators/anomalies/juliaSetModelGenerator";

import { JuliaSetPostProcess } from "@/frontend/postProcesses/anomalies/juliaSetPostProcess";
import { EmptyCelestialBody } from "@/frontend/universe/emptyCelestialBody";

export function createJuliaSetScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const urlParams = new URLSearchParams(window.location.search);

    const camera = new ArcRotateCamera("ArcRotateCamera", 0, 3.14 / 3, 30, Vector3.Zero(), scene);
    camera.attachControl();
    camera.lowerRadiusLimit = 0.5;
    camera.wheelPrecision *= 100;
    camera.minZ = 0.01;

    const depthRenderer = scene.enableDepthRenderer(null, false, true);

    const model = newSeededJuliaSetModel(
        "juliaSet",
        Number(urlParams.get("seed") ?? Math.random() * 100_000),
        "Julia Set",
        [],
    );

    const anomaly = new EmptyCelestialBody(model, scene);
    anomaly.getTransform().scalingDeterminant = 1 / 100e3;

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

    progressCallback(1, "Loading complete");

    return Promise.resolve(scene);
}
