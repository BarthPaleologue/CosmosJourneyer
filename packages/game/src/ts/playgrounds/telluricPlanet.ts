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

import { Color3, Scene, TransformNode, Vector3, type AbstractEngine } from "@babylonjs/core";
import { generateTelluricPlanetModel } from "@cosmos-journeyer/universe-generation";

import { getSunModel } from "@/backend/universe/customSystems/sol/sun";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { DepthRendererManager } from "@/frontend/helpers/depthRendererManager";
import { StellarLightSystem } from "@/frontend/helpers/stellarLightSystem";
import { lookAt } from "@/frontend/helpers/transform";
import { CelestialBodyUberShaderPass } from "@/frontend/postProcesses/celestialBodyUberShader/celestialBodyUberShaderPass";
import { TelluricPlanet } from "@/frontend/universe/planets/telluricPlanet/telluricPlanet";
import { ChunkForgeWorkers } from "@/frontend/universe/planets/telluricPlanet/terrain/chunks/chunkForgeWorkers";
import { ScatteringSystem } from "@/frontend/universe/planets/telluricPlanet/terrain/chunks/scatteringSystem";

import { getRgbFromTemperature } from "@/utils/specrend";

import { Settings } from "@/settings";

import { addToWindow, enablePhysics } from "./utils";

export async function createTelluricPlanetScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;
    scene.clearColor.setAll(0);

    await enablePhysics(scene);

    const chunkForgeResult = await ChunkForgeWorkers.New(Settings.VERTEX_RESOLUTION);
    if (!chunkForgeResult.success) {
        throw chunkForgeResult.error;
    }
    const chunkForge = chunkForgeResult.value;

    const assets = await loadRenderingAssets(scene, progressMonitor);

    const stellarLightSystem = new StellarLightSystem(scene);

    const scatteringSystem = new ScatteringSystem(assets.objects, stellarLightSystem, scene);

    const scalingFactor = Settings.EARTH_RADIUS * 2;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    controls.getTransform().setAbsolutePosition(new Vector3(0, 1, -2).scaleInPlace(scalingFactor));
    lookAt(controls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);

    // This attaches the camera to the canvas
    camera.attachControl();

    const depthRendererManager = new DepthRendererManager(scene);

    const sunModel = getSunModel();
    const sunTransform = new TransformNode("sunTransform", scene);
    sunTransform.position = new Vector3(7, 5, -10).scale(10_000e3);

    const sunColor = getRgbFromTemperature(sunModel.blackBodyTemperature);
    stellarLightSystem.registerStellarObject(sunTransform, new Color3(sunColor.r, sunColor.g, sunColor.b));

    const urlParams = new URLSearchParams(window.location.search);
    const seed = Number(urlParams.get("seed") ?? Math.floor(Math.random() * 1000));
    console.log("seed", seed);

    const telluricPlanetModel = generateTelluricPlanetModel("telluricPlanet", seed, "Telluric Planet", [sunModel]);

    const planet = new TelluricPlanet(telluricPlanetModel, assets, scene);

    const celestialBodyUberShader =
        planet.atmosphereUniforms !== null ||
        planet.cloudsUniforms !== null ||
        planet.oceanUniforms !== null ||
        planet.ringsUniforms !== null
            ? new CelestialBodyUberShaderPass(
                  planet.getTransform(),
                  planet.getBoundingRadius(),
                  false,
                  {
                      atmosphere: planet.atmosphereUniforms,
                      clouds: planet.cloudsUniforms,
                      ocean: planet.oceanUniforms,
                      rings: planet.ringsUniforms,
                  },
                  stellarLightSystem.getLights(),
                  [planet],
                  assets.textures.water,
                  depthRendererManager,
                  scene,
              )
            : null;

    if (celestialBodyUberShader !== null) {
        camera.attachPostProcess(celestialBodyUberShader);
    }

    if (planet.cloudsUniforms !== null) {
        await new Promise<void>((resolve) => {
            planet.cloudsUniforms?.lut.getTexture().executeWhenReady(() => {
                resolve();
            });
        });
    }

    if (planet.ringsUniforms) {
        await new Promise<void>((resolve) => {
            if (planet.ringsUniforms?.patternLut.type === "procedural") {
                planet.ringsUniforms.patternLut.lut.getTexture().executeWhenReady(() => {
                    resolve();
                });
            }
        });
    }

    addToWindow("planet", planet);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);
        celestialBodyUberShader?.update(deltaSeconds);
        planet.updateLOD(camera, chunkForge, scatteringSystem);
        chunkForge.update();
        planet.computeCulling(camera);

        stellarLightSystem.update(camera, planet);
    });

    await new Promise<void>((resolve) => {
        const observer = engine.onBeginFrameObservable.add(() => {
            controls.update(0);
            planet.updateLOD(camera, chunkForge, scatteringSystem);
            chunkForge.update();
            planet.computeCulling(camera);

            if (chunkForge.isIdle() && planet.terrain.isIdle()) {
                engine.onBeginFrameObservable.remove(observer);
                resolve();
            }
        });
    });

    return scene;
}
