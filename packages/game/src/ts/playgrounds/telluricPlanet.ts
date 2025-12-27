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

import { PointLight, Scene, Vector3, type AbstractEngine } from "@babylonjs/core";

import { newSeededTelluricPlanetModel } from "@/backend/universe/proceduralGenerators/telluricPlanetModelGenerator";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { lookAt } from "@/frontend/helpers/transform";
import { AtmosphericScatteringPostProcess } from "@/frontend/postProcesses/atmosphere/atmosphericScatteringPostProcess";
import { FlatCloudsPostProcess } from "@/frontend/postProcesses/clouds/flatCloudsPostProcess";
import { OceanPostProcess } from "@/frontend/postProcesses/ocean/oceanPostProcess";
import { RingsPostProcess } from "@/frontend/postProcesses/rings/ringsPostProcess";
import { ShadowPostProcess } from "@/frontend/postProcesses/shadowPostProcess";
import { TelluricPlanet } from "@/frontend/universe/planets/telluricPlanet/telluricPlanet";
import { ChunkForgeWorkers } from "@/frontend/universe/planets/telluricPlanet/terrain/chunks/chunkForgeWorkers";

import { Settings } from "@/settings";

import { enablePhysics } from "./utils";

export async function createTelluricPlanetScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;
    scene.clearColor.setAll(0);

    await enablePhysics(scene);

    const chunkForge = new ChunkForgeWorkers(Settings.VERTEX_RESOLUTION);

    const assets = await loadRenderingAssets(scene, progressMonitor);

    const scalingFactor = Settings.EARTH_RADIUS * 2;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    controls.getTransform().setAbsolutePosition(new Vector3(0, 1, -2).scaleInPlace(scalingFactor));
    lookAt(controls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);

    // This attaches the camera to the canvas
    camera.attachControl();

    scene.enableDepthRenderer(null, false, true);

    const light = new PointLight("light1", new Vector3(7, 5, -10).scaleInPlace(scalingFactor), scene);
    light.falloffType = PointLight.FALLOFF_STANDARD;

    const urlParams = new URLSearchParams(window.location.search);
    const seed = urlParams.get("seed");

    const telluricPlanetModel = newSeededTelluricPlanetModel(
        "telluricPlanet",
        seed !== null ? Number(seed) : Math.random() * 1000,
        "Telluric Planet",
        [],
    );

    const planet = new TelluricPlanet(telluricPlanetModel, assets, scene);

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

    if (planet.oceanUniforms !== null) {
        const ocean = new OceanPostProcess(
            planet.getTransform(),
            planet.getBoundingRadius(),
            planet.oceanUniforms,
            [light],
            assets.textures.water,
            scene,
        );
        camera.attachPostProcess(ocean);
    }

    if (planet.cloudsUniforms !== null) {
        const clouds = new FlatCloudsPostProcess(
            planet.getTransform(),
            planet.getBoundingRadius(),
            planet.cloudsUniforms,
            [light],
            scene,
        );
        camera.attachPostProcess(clouds);
    }

    if (planet.atmosphereUniforms !== null) {
        const atmosphere = new AtmosphericScatteringPostProcess(
            planet.getTransform(),
            planet.getBoundingRadius(),
            planet.atmosphereUniforms,
            [light],
            scene,
        );
        camera.attachPostProcess(atmosphere);
    }

    if (planet.ringsUniforms) {
        const rings = new RingsPostProcess(
            planet.getTransform(),
            planet.ringsUniforms,
            telluricPlanetModel,
            [light],
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

        chunkForge.update(assets);

        planet.computeCulling(camera);
        planet.updateLOD(camera.globalPosition, chunkForge);
        planet.updateMaterial([light]);
    });

    return scene;
}
