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

import { AbstractEngine, PointLight, Scene, Vector3 } from "@babylonjs/core";

import { newSeededGasPlanetModel } from "@/backend/universe/proceduralGenerators/gasPlanetModelGenerator";

import { loadTextures } from "@/frontend/assets/textures";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { AtmosphericScatteringPostProcess } from "@/frontend/postProcesses/atmosphere/atmosphericScatteringPostProcess";
import { RingsPostProcess } from "@/frontend/postProcesses/rings/ringsPostProcess";
import { RingsProceduralPatternLut } from "@/frontend/postProcesses/rings/ringsProceduralLut";
import { ShadowPostProcess } from "@/frontend/postProcesses/shadowPostProcess";
import { GasPlanet } from "@/frontend/universe/planets/gasPlanet/gasPlanet";

import { Settings } from "@/settings";

import { ItemPool } from "../utils/itemPool";
import { enablePhysics } from "./utils";

export async function createGasPlanetScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.clearColor.setAll(0);

    const textures = await loadTextures((loadedCount, totalCount, itemName) => {
        progressCallback(loadedCount / totalCount, `Loading ${itemName}`);
    }, scene);

    await enablePhysics(scene);

    const scalingFactor = Settings.EARTH_RADIUS * 10;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    controls.getTransform().setAbsolutePosition(new Vector3(0, 1, -2).scaleInPlace(scalingFactor));
    controls.getTransform().lookAt(Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl();

    const depthRenderer = scene.enableDepthRenderer(null, true, true);
    depthRenderer.clearColor.set(0, 0, 0, 1);

    const light = new PointLight("light1", new Vector3(7, 5, -10).scaleInPlace(scalingFactor), scene);

    const urlParams = new URLSearchParams(window.location.search);
    const seed = urlParams.get("seed");

    const gasPlanetModel = newSeededGasPlanetModel(
        "gasPlanet",
        seed !== null ? Number(seed) : Math.random() * 1000,
        "Gas Planet",
        [],
    );

    const ringsLutPool = new ItemPool<RingsProceduralPatternLut>(() => new RingsProceduralPatternLut(scene));

    const planet = new GasPlanet(gasPlanetModel, textures, ringsLutPool, scene);

    const shadow = new ShadowPostProcess(
        planet.getTransform(),
        planet.getBoundingRadius(),
        planet.ringsUniforms,
        null,
        false,
        [
            {
                getBoundingRadius: () => 0,
                getLight: () => light,
            },
        ],
        scene,
    );
    camera.attachPostProcess(shadow);

    const atmosphere = new AtmosphericScatteringPostProcess(
        planet.getTransform(),
        planet.getBoundingRadius(),
        planet.atmosphereUniforms,
        [light],
        scene,
    );
    camera.attachPostProcess(atmosphere);

    if (planet.ringsUniforms) {
        const rings = new RingsPostProcess(planet.getTransform(), planet.ringsUniforms, gasPlanetModel, [light], scene);
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

        const cameraPosition = controls.getTransform().position.clone();

        controls.getTransform().position = Vector3.Zero();
        planet.getTransform().position.subtractInPlace(cameraPosition);
        light.position.subtractInPlace(cameraPosition);
    });

    progressCallback(1, "Rings scene loaded");

    return scene;
}
