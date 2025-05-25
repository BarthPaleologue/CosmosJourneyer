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

import { AbstractEngine, Axis, Light, PointLight, Scene, Vector3 } from "@babylonjs/core";

import { getJupiterModel } from "@/backend/universe/customSystems/sol/jupiter";

import { loadTextures } from "@/frontend/assets/textures";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { AtmosphericScatteringPostProcess } from "@/frontend/postProcesses/atmosphere/atmosphericScatteringPostProcess";
import { RingsProceduralPatternLut } from "@/frontend/postProcesses/rings/ringsProceduralLut";
import { GasPlanet } from "@/frontend/universe/planets/gasPlanet/gasPlanet";

import { ItemPool } from "@/utils/itemPool";

import { Settings } from "@/settings";

import { enablePhysics } from "../utils";

export async function createJupiterScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.clearColor.set(0, 0, 0, 1);

    const textures = await loadTextures((loadedCount, totalCount, itemName) => {
        progressCallback(loadedCount / totalCount, `Loading ${itemName}`);
    }, scene);

    await enablePhysics(scene);

    const scalingFactor = 6_000e3 * 11;

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
    light.falloffType = Light.FALLOFF_STANDARD;

    Settings.EARTH_RADIUS = 6_371e3;

    const gasPlanetModel = getJupiterModel([]);

    const ringsLutPool = new ItemPool<RingsProceduralPatternLut>(() => new RingsProceduralPatternLut(scene));

    const planet = new GasPlanet(gasPlanetModel, textures, ringsLutPool, scene);

    const atmosphere = new AtmosphericScatteringPostProcess(
        planet.getTransform(),
        planet.getBoundingRadius(),
        planet.atmosphereUniforms,
        [light],
        scene,
    );
    camera.attachPostProcess(atmosphere);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);

        planet.getTransform().rotate(Axis.Y, deltaSeconds * 0.1);
        planet.updateMaterial([light], deltaSeconds);

        const cameraPosition = controls.getTransform().position.clone();

        controls.getTransform().position = Vector3.Zero();
        planet.getTransform().position.subtractInPlace(cameraPosition);
        light.position.subtractInPlace(cameraPosition);
    });

    progressCallback(1, "Jupiter scene loaded");

    return scene;
}
