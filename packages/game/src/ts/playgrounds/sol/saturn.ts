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

import { DirectionalLight, Scene, Vector3, type AbstractEngine } from "@babylonjs/core";

import { getSaturnModel } from "@/backend/universe/customSystems/sol/saturn";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { DepthRendererManager } from "@/frontend/helpers/depthRendererManager";
import { lookAt } from "@/frontend/helpers/transform";
import { CelestialBodyUberShaderPass } from "@/frontend/postProcesses/celestialBodyUberShader/celestialBodyUberShaderPass";
import { RingsProceduralPatternLut } from "@/frontend/postProcesses/rings/ringsProceduralLut";
import { AsteroidField } from "@/frontend/universe/asteroidFields/asteroidField";
import { GasPlanet } from "@/frontend/universe/planets/gasPlanet/gasPlanet";

import { ItemPool } from "@/utils/itemPool";

import { enablePhysics } from "../utils";

export async function createSaturnScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;
    scene.clearColor.set(0, 0, 0, 1);

    await enablePhysics(scene);

    const assets = await loadRenderingAssets(scene, progressMonitor);

    const scalingFactor = 6_000e3 * 16;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    controls.getTransform().setAbsolutePosition(new Vector3(0, 2, -2).scaleInPlace(scalingFactor));
    lookAt(controls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);

    // This attaches the camera to the canvas
    camera.attachControl();

    const depthRendererManager = new DepthRendererManager(scene);

    const light = new DirectionalLight("light1", new Vector3(-7, -5, 10).normalize(), scene);

    const gasPlanetModel = getSaturnModel([]);

    const ringsLutPool = new ItemPool<RingsProceduralPatternLut>(() => new RingsProceduralPatternLut(scene));

    const planet = new GasPlanet(gasPlanetModel, assets.textures, ringsLutPool, scene);

    let asteroidField: AsteroidField | null = null;
    if (gasPlanetModel.rings !== null) {
        asteroidField = new AsteroidField(
            0,
            planet.getTransform(),
            gasPlanetModel.rings.innerRadius,
            gasPlanetModel.rings.outerRadius,
            scene,
        );
    }

    const celestialBodyUberShader = new CelestialBodyUberShaderPass(
        planet.getTransform(),
        planet.getBoundingRadius(),
        false,
        {
            raymarchedBody: null,
            atmosphere: planet.atmosphereUniforms,
            clouds: null,
            ocean: null,
            rings: planet.ringsUniforms,
        },
        [light],
        [planet],
        null,
        depthRendererManager,
        scene,
    );
    camera.attachPostProcess(celestialBodyUberShader);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);

        planet.updateMaterial([light], deltaSeconds);

        asteroidField?.update(camera.globalPosition, assets.objects.asteroids, deltaSeconds);
    });

    return scene;
}
