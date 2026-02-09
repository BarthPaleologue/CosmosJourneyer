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

import { ArcRotateCamera, type PostProcess, type TransformNode } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { generateJuliaSetModel } from "@/backend/universe/proceduralGenerators/anomalies/juliaSetModelGenerator";
import { generateMandelboxModel } from "@/backend/universe/proceduralGenerators/anomalies/mandelboxModelGenerator";
import { generateMandelbulbModel } from "@/backend/universe/proceduralGenerators/anomalies/mandelbulbModelGenerator";
import { generateMengerSpongeModel } from "@/backend/universe/proceduralGenerators/anomalies/mengerSpongeModelGenerator";
import { generateSierpinskiPyramidModel } from "@/backend/universe/proceduralGenerators/anomalies/sierpinskiPyramidModelGenerator";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { JuliaSetPostProcess } from "@/frontend/postProcesses/anomalies/juliaSetPostProcess";
import { MandelboxPostProcess } from "@/frontend/postProcesses/anomalies/mandelboxPostProcess";
import { MandelbulbPostProcess } from "@/frontend/postProcesses/anomalies/mandelbulbPostProcess";
import { MengerSpongePostProcess } from "@/frontend/postProcesses/anomalies/mengerSpongePostProcess";
import { SierpinskiPyramidPostProcess } from "@/frontend/postProcesses/anomalies/sierpinskiPyramidPostProcess";
import { type UpdatablePostProcess } from "@/frontend/postProcesses/updatablePostProcess";
import { EmptyCelestialBody } from "@/frontend/universe/emptyCelestialBody";

export async function createXrScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const urlParams = new URLSearchParams(window.location.search);

    const camera = new ArcRotateCamera("ArcRotateCamera", 0, 3.14 / 3, 5, Vector3.Zero(), scene);
    camera.attachControl();
    camera.lowerRadiusLimit = 0.5;
    camera.wheelPrecision *= 100;
    camera.minZ = 0.01;

    const depthRenderer = scene.enableDepthRenderer(null, false, true);

    function createMandelbulb(): TransformNode {
        const mandelBulbModel = generateMandelbulbModel("mandelbulb", Math.random() * 100_000, "XR Anomaly", []);
        const mandelbulb = new EmptyCelestialBody(mandelBulbModel, scene);
        mandelbulb.getTransform().scalingDeterminant = 1 / 400e3;

        const mandelbulbPP = new MandelbulbPostProcess(
            mandelbulb.getTransform(),
            mandelbulb.getBoundingRadius(),
            mandelBulbModel,
            scene,
            [],
        );

        setupPP(mandelbulbPP);

        return mandelbulb.getTransform();
    }

    function createJulia(): TransformNode {
        const juliaModel = generateJuliaSetModel("julia", Math.random() * 100_000, "XR Anomaly", []);
        const julia = new EmptyCelestialBody(juliaModel, scene);
        julia.getTransform().scalingDeterminant = 1 / 400e3;

        const juliaPP = new JuliaSetPostProcess(
            julia.getTransform(),
            julia.getBoundingRadius(),
            juliaModel.accentColor,
            scene,
            [],
        );

        setupPP(juliaPP);

        return julia.getTransform();
    }

    function createMandelbox(): TransformNode {
        const mandelboxModel = generateMandelboxModel("mandelbox", Math.random() * 100_000, "XR Anomaly", []);
        const mandelbox = new EmptyCelestialBody(mandelboxModel, scene);
        mandelbox.getTransform().scalingDeterminant = 1 / 100e3;

        const mandelboxPP = new MandelboxPostProcess(
            mandelbox.getTransform(),
            mandelbox.getBoundingRadius(),
            mandelboxModel,
            scene,
            [],
        );

        setupPP(mandelboxPP);

        return mandelbox.getTransform();
    }

    function createSierpinskiPyramid(): TransformNode {
        const sierpinskiPyramidModel = generateSierpinskiPyramidModel(
            "sierpinski",
            Math.random() * 100_000,
            "XR Anomaly",
            [],
        );
        const sierpinskiPyramid = new EmptyCelestialBody(sierpinskiPyramidModel, scene);
        sierpinskiPyramid.getTransform().scalingDeterminant = 1 / 100e3;

        const sierpinskiPyramidPP = new SierpinskiPyramidPostProcess(
            sierpinskiPyramid.getTransform(),
            sierpinskiPyramid.getBoundingRadius(),
            sierpinskiPyramidModel,
            scene,
            [],
        );

        setupPP(sierpinskiPyramidPP);

        return sierpinskiPyramid.getTransform();
    }

    function createMengerSponge(): TransformNode {
        const mengerSpongeModel = generateMengerSpongeModel("menger", Math.random() * 100_000, "XR Anomaly", []);
        const mengerSponge = new EmptyCelestialBody(mengerSpongeModel, scene);
        mengerSponge.getTransform().scalingDeterminant = 1 / 100e3;

        const mengerSpongePP = new MengerSpongePostProcess(
            mengerSponge.getTransform(),
            mengerSponge.getBoundingRadius(),
            mengerSpongeModel,
            scene,
            [],
        );

        setupPP(mengerSpongePP);

        return mengerSponge.getTransform();
    }

    function setupPP(pp: PostProcess & UpdatablePostProcess) {
        scene.cameras.forEach((camera) => camera.attachPostProcess(pp));
        scene.onNewCameraAddedObservable.add((camera) => {
            camera.attachPostProcess(pp);
        });

        scene.onBeforeRenderObservable.add(() => {
            const deltaSeconds = engine.getDeltaTime() / 1000;
            pp.update(deltaSeconds);
        });
    }

    const sceneType = urlParams.get("fractal");

    if (sceneType === "mandelbulb") {
        createMandelbulb();
    } else if (sceneType === "julia") {
        createJulia();
    } else if (sceneType === "mandelbox") {
        createMandelbox();
    } else if (sceneType === "pyramid") {
        createSierpinskiPyramid();
    } else {
        createMengerSponge();
    }

    const xr = await scene.createDefaultXRExperienceAsync();

    const xrCamera = xr.baseExperience.camera;
    xrCamera.setTransformationFromNonVRCamera(camera, true);

    scene.onBeforeCameraRenderObservable.add((camera) => {
        depthRenderer.getDepthMap().activeCamera = camera;
    });

    return scene;
}
