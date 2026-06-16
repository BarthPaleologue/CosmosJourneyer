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

import { ArcRotateCamera, DirectionalLight, type TransformNode } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import {
    generateJuliaSetModel,
    generateMandelboxModel,
    generateMandelbulbModel,
    generateMengerSpongeModel,
    generateSierpinskiPyramidModel,
} from "@cosmos-journeyer/universe-generation";
import { type ProceduralRingsModel } from "@cosmos-journeyer/universe-model";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { DepthRendererManager } from "@/frontend/helpers/depthRendererManager";
import { CelestialBodyUberShaderPass } from "@/frontend/postProcesses/celestialBodyUberShader/celestialBodyUberShaderPass";
import { RingsProceduralPatternLut } from "@/frontend/postProcesses/rings/ringsProceduralLut";
import { RingsUniforms } from "@/frontend/postProcesses/rings/ringsUniform";
import { EmptyCelestialBody } from "@/frontend/universe/emptyCelestialBody";

import { ItemPool } from "@/utils/itemPool";

export async function createXrScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const urlParams = new URLSearchParams(window.location.search);

    const camera = new ArcRotateCamera("ArcRotateCamera", 0, 3.14 / 3, 5, Vector3.Zero(), scene);
    camera.attachControl();
    camera.lowerRadiusLimit = 0.5;
    camera.wheelPrecision *= 100;
    camera.minZ = 0.01;

    const depthRendererManager = new DepthRendererManager(scene);
    const light = new DirectionalLight("xrAnomalyLight", new Vector3(-1, -0.4, -0.7).normalize(), scene);
    const ringsLutPool = new ItemPool<RingsProceduralPatternLut>(() => new RingsProceduralPatternLut(scene));
    const ringsReadyPromises: Promise<void>[] = [];

    function createAnomalyRings(transform: TransformNode, boundingRadius: number): RingsUniforms {
        const visualRadius = boundingRadius * transform.scalingDeterminant;
        const frequencyScale = 1e6 / visualRadius;
        const ringsModel: ProceduralRingsModel = {
            type: "procedural",
            innerRadius: visualRadius * 1.15,
            outerRadius: visualRadius * 1.85,
            seed: Math.random() * 1000,
            frequency: 12.0 * frequencyScale,
            iceAlbedo: { r: 0.8, g: 0.88, b: 1.0 },
            dustAlbedo: { r: 0.7, g: 0.55, b: 0.45 },
        };

        const ringsUniforms = RingsUniforms.NewProcedural(ringsModel, ringsLutPool, visualRadius * 0.1, scene);
        ringsReadyPromises.push(
            new Promise<void>((resolve) => {
                if (ringsUniforms.patternLut.type !== "procedural") {
                    resolve();
                    return;
                }

                ringsUniforms.patternLut.lut.getTexture().executeWhenReady(() => {
                    resolve();
                });
            }),
        );

        return ringsUniforms;
    }

    function createMandelbulb(): TransformNode {
        const mandelBulbModel = generateMandelbulbModel("mandelbulb", Math.random() * 100_000, "XR Anomaly", []);
        const mandelbulb = new EmptyCelestialBody(mandelBulbModel, scene);
        mandelbulb.getTransform().scalingDeterminant = 1 / 400e3;
        const ringsUniforms = createAnomalyRings(mandelbulb.getTransform(), mandelbulb.getBoundingRadius());

        const mandelbulbPP = new CelestialBodyUberShaderPass(
            {
                transform: mandelbulb.getTransform(),
                boundingRadius: mandelbulb.getBoundingRadius(),
                emitsLight: false,
            },
            { raymarchedBody: mandelBulbModel, rings: ringsUniforms },
            { stellarObjects: [light], shadowCasters: [] },
            depthRendererManager,
            scene,
        );

        setupPP(mandelbulbPP);

        return mandelbulb.getTransform();
    }

    function createJulia(): TransformNode {
        const juliaModel = generateJuliaSetModel("julia", Math.random() * 100_000, "XR Anomaly", []);
        const julia = new EmptyCelestialBody(juliaModel, scene);
        julia.getTransform().scalingDeterminant = 1 / 400e3;
        const ringsUniforms = createAnomalyRings(julia.getTransform(), julia.getBoundingRadius());

        const juliaPP = new CelestialBodyUberShaderPass(
            {
                transform: julia.getTransform(),
                boundingRadius: julia.getBoundingRadius(),
                emitsLight: false,
            },
            { raymarchedBody: juliaModel, rings: ringsUniforms },
            { stellarObjects: [light], shadowCasters: [] },
            depthRendererManager,
            scene,
        );

        setupPP(juliaPP);

        return julia.getTransform();
    }

    function createMandelbox(): TransformNode {
        const mandelboxModel = generateMandelboxModel("mandelbox", Math.random() * 100_000, "XR Anomaly", []);
        const mandelbox = new EmptyCelestialBody(mandelboxModel, scene);
        mandelbox.getTransform().scalingDeterminant = 1 / 100e3;
        const ringsUniforms = createAnomalyRings(mandelbox.getTransform(), mandelbox.getBoundingRadius());

        const mandelboxPP = new CelestialBodyUberShaderPass(
            {
                transform: mandelbox.getTransform(),
                boundingRadius: mandelbox.getBoundingRadius(),
                emitsLight: false,
            },
            { raymarchedBody: mandelboxModel, rings: ringsUniforms },
            { stellarObjects: [light], shadowCasters: [] },
            depthRendererManager,
            scene,
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
        const ringsUniforms = createAnomalyRings(
            sierpinskiPyramid.getTransform(),
            sierpinskiPyramid.getBoundingRadius(),
        );

        const sierpinskiPyramidPP = new CelestialBodyUberShaderPass(
            {
                transform: sierpinskiPyramid.getTransform(),
                boundingRadius: sierpinskiPyramid.getBoundingRadius(),
                emitsLight: false,
            },
            { raymarchedBody: sierpinskiPyramidModel, rings: ringsUniforms },
            { stellarObjects: [light], shadowCasters: [] },
            depthRendererManager,
            scene,
        );

        setupPP(sierpinskiPyramidPP);

        return sierpinskiPyramid.getTransform();
    }

    function createMengerSponge(): TransformNode {
        const mengerSpongeModel = generateMengerSpongeModel("menger", Math.random() * 100_000, "XR Anomaly", []);
        const mengerSponge = new EmptyCelestialBody(mengerSpongeModel, scene);
        mengerSponge.getTransform().scalingDeterminant = 1 / 100e3;
        const ringsUniforms = createAnomalyRings(mengerSponge.getTransform(), mengerSponge.getBoundingRadius());

        const mengerSpongePP = new CelestialBodyUberShaderPass(
            {
                transform: mengerSponge.getTransform(),
                boundingRadius: mengerSponge.getBoundingRadius(),
                emitsLight: false,
            },
            { raymarchedBody: mengerSpongeModel, rings: ringsUniforms },
            { stellarObjects: [light], shadowCasters: [] },
            depthRendererManager,
            scene,
        );

        setupPP(mengerSpongePP);

        return mengerSponge.getTransform();
    }

    function setupPP(pp: CelestialBodyUberShaderPass) {
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

    await Promise.all(ringsReadyPromises);

    const xr = await scene.createDefaultXRExperienceAsync();

    const xrCamera = xr.baseExperience.camera;
    xrCamera.setTransformationFromNonVRCamera(camera, true);

    scene.onBeforeCameraRenderObservable.add((camera) => {
        depthRendererManager.setActiveCamera(camera);
    });

    return scene;
}
