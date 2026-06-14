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
import { SolarTemperature } from "@cosmos-journeyer/physics";
import { generateGasPlanetModel } from "@cosmos-journeyer/universe-generation";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadTextures } from "@/frontend/assets/textures";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { DepthRendererManager } from "@/frontend/helpers/depthRendererManager";
import { lookAt } from "@/frontend/helpers/transform";
import { AtmosphericScatteringPostProcess } from "@/frontend/postProcesses/atmosphere/atmosphericScatteringPostProcess";
import { RingsPostProcess } from "@/frontend/postProcesses/rings/ringsPostProcess";
import { RingsProceduralPatternLut } from "@/frontend/postProcesses/rings/ringsProceduralLut";
import { ShadowPostProcess } from "@/frontend/postProcesses/shadowPostProcess";
import { GasPlanet } from "@/frontend/universe/planets/gasPlanet/gasPlanet";

import { getRgbFromTemperature } from "@/utils/specrend";

import { ItemPool } from "../utils/itemPool";
import { enablePhysics } from "./utils";

export async function createGasPlanetScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;
    scene.clearColor.setAll(0);

    const textures = await loadTextures(scene, progressMonitor);

    await enablePhysics(scene);

    const urlParams = new URLSearchParams(window.location.search);
    const seed = urlParams.get("seed");

    const gasPlanetModel = generateGasPlanetModel(
        "gasPlanet",
        seed !== null ? Number(seed) : Math.random() * 1000,
        "Gas Planet",
        [],
    );

    const ringsLutPool = new ItemPool<RingsProceduralPatternLut>(() => new RingsProceduralPatternLut(scene));

    const planet = new GasPlanet(gasPlanetModel, textures, ringsLutPool, scene);

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = gasPlanetModel.radius;
    camera.maxZ = 1e10;

    controls.getTransform().setAbsolutePosition(new Vector3(0, 1, -2).scaleInPlace(gasPlanetModel.radius * 2));
    lookAt(controls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);

    // This attaches the camera to the canvas
    camera.attachControl();

    const depthRendererManager = new DepthRendererManager(scene);

    const light = new DirectionalLight("light1", new Vector3(-7, -5, 10).normalize(), scene);
    const lightColor = getRgbFromTemperature(SolarTemperature);
    light.diffuse.set(lightColor.r, lightColor.g, lightColor.b);

    const shadow = new ShadowPostProcess(
        planet.getTransform(),
        planet.getBoundingRadius(),
        [light],
        depthRendererManager,
        scene,
    );
    camera.attachPostProcess(shadow);

    const atmosphere = new AtmosphericScatteringPostProcess(
        planet.getTransform(),
        planet.getBoundingRadius(),
        planet.atmosphereUniforms,
        [light],
        depthRendererManager,
        scene,
    );
    camera.attachPostProcess(atmosphere);

    if (planet.ringsUniforms) {
        const rings = new RingsPostProcess(
            planet.getTransform(),
            planet.ringsUniforms,
            gasPlanetModel,
            [light],
            [planet],
            depthRendererManager,
            scene,
        );
        camera.attachPostProcess(rings);

        await new Promise<void>((resolve) => {
            if (planet.ringsUniforms?.patternLut.type === "procedural") {
                planet.ringsUniforms.patternLut.lut.getTexture().executeWhenReady(() => {
                    resolve();
                });
            }
        });
    }

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);
        planet.updateMaterial([light], deltaSeconds);
    });

    return scene;
}
