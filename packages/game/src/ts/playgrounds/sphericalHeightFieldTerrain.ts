//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { DirectionalLight, PBRMetallicRoughnessMaterial, Scene, Vector3, type AbstractEngine } from "@babylonjs/core";

import { getSunModel } from "@/backend/universe/customSystems/sol/sun";
import { generateTelluricPlanetModel } from "@/backend/universe/proceduralGenerators/telluricPlanetModelGenerator";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { lookAt } from "@/frontend/helpers/transform";
import { ChunkForgeWorkers } from "@/frontend/universe/planets/telluricPlanet/terrain/chunks/chunkForgeWorkers";
import { ScatteringSystemMock } from "@/frontend/universe/planets/telluricPlanet/terrain/chunks/scatteringSystem";
import { SphericalHeightFieldTerrain } from "@/frontend/universe/planets/telluricPlanet/terrain/sphericalHeightFieldTerrain";

import { Settings } from "@/settings";

import { enablePhysics } from "./utils";

export async function createSphericalHeightFieldTerrainScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    const chunkForgeResult = await ChunkForgeWorkers.New(Settings.VERTEX_RESOLUTION);
    if (!chunkForgeResult.success) {
        throw chunkForgeResult.error;
    }
    const chunkForge = chunkForgeResult.value;

    const scatteringSystem = new ScatteringSystemMock();

    const scalingFactor = Settings.EARTH_RADIUS * 2;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    controls.getTransform().setAbsolutePosition(new Vector3(0, 1, -2).scaleInPlace(scalingFactor));
    lookAt(controls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);
    camera.attachControl();

    new DirectionalLight("light", new Vector3(-7, -5, 10).normalize(), scene);

    const urlParams = new URLSearchParams(window.location.search);
    const seed = Number(urlParams.get("seed") ?? Math.floor(Math.random() * 1000));
    console.log("seed", seed);

    const telluricPlanetModel = generateTelluricPlanetModel("telluricPlanet", seed, "Telluric Planet", [getSunModel()]);

    const terrainMaterial = new PBRMetallicRoughnessMaterial("terrainMaterial", scene);
    terrainMaterial.metallic = 0;
    terrainMaterial.roughness = 0.7;
    terrainMaterial.baseColor.fromHexString("#505040");

    const terrain = new SphericalHeightFieldTerrain(telluricPlanetModel, terrainMaterial, scene);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);

        terrain.updateLOD(camera.globalPosition, chunkForge, scatteringSystem);
        chunkForge.update();

        terrain.computeCulling(camera);
    });

    await new Promise<void>((resolve) => {
        const observer = engine.onBeginFrameObservable.add(() => {
            terrain.updateLOD(camera.getWorldMatrix().getTranslation(), chunkForge, scatteringSystem);
            chunkForge.update();

            if (chunkForge.isIdle()) {
                engine.onBeginFrameObservable.remove(observer);
                resolve();
            }
        });
    });

    return scene;
}
