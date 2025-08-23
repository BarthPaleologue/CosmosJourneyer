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

import {
    Color4,
    GizmoManager,
    Light,
    LightGizmo,
    PointLight,
    Scene,
    Vector3,
    type WebGPUEngine,
} from "@babylonjs/core";

import { type TerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";
import { newSeededTelluricPlanetModel } from "@/backend/universe/proceduralGenerators/telluricPlanetModelGenerator";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { PlanetHeightMapAtlas } from "@/frontend/assets/planetHeightMapAtlas";
import { loadTextures } from "@/frontend/assets/textures";
import { loadHeightMaps } from "@/frontend/assets/textures/heightMaps";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { AtmosphereUniforms } from "@/frontend/postProcesses/atmosphere/atmosphereUniforms";
import { AtmosphericScatteringPostProcess } from "@/frontend/postProcesses/atmosphere/atmosphericScatteringPostProcess";
import { CloudsUniforms } from "@/frontend/postProcesses/clouds/cloudsUniforms";
import { FlatCloudsPostProcess } from "@/frontend/postProcesses/clouds/flatCloudsPostProcess";
import { OceanPostProcess } from "@/frontend/postProcesses/ocean/oceanPostProcess";
import { OceanUniforms } from "@/frontend/postProcesses/ocean/oceanUniforms";
import { ChunkForgeCompute } from "@/frontend/terrain/sphere/chunkForgeCompute";
import { SphericalHeightFieldTerrain } from "@/frontend/terrain/sphere/sphericalHeightFieldTerrain";
import { TelluricPlanetMaterial } from "@/frontend/universe/planets/telluricPlanet/telluricPlanetMaterial";

import { addToWindow } from "./utils";

export async function createTelluricPlanetScene(
    engine: WebGPUEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.clearColor.set(0, 0, 0, 1);
    scene.useRightHandedSystem = true;
    scene.defaultCursor = "default";

    const textures = await loadTextures(scene, progressMonitor);

    const heightMaps = await loadHeightMaps(scene, progressMonitor);

    const earthRadius = 6_371e3; // Average radius of Earth in meters

    // This creates and positions a free camera (non-mesh)
    const controls = new DefaultControls(scene);
    controls.getTransform().position = new Vector3(0, 5, -10).normalize().scale(earthRadius * 3);
    controls.getTransform().lookAt(Vector3.Zero());
    controls.speed = earthRadius / 3;

    const camera = controls.getActiveCamera();
    camera.minZ = 0.01;
    camera.maxZ = 0.0;

    // This attaches the camera to the canvas
    camera.attachControl();

    scene.activeCamera = camera;

    const depthRenderer = scene.enableDepthRenderer(camera, true, true);
    depthRenderer.clearColor = new Color4(0, 0, 0, 1);

    const light = new PointLight("light", new Vector3(10, 2, -10).normalize().scale(earthRadius * 10), scene);
    light.falloffType = Light.FALLOFF_STANDARD;
    light.intensity = 4;

    const lightGizmo = new LightGizmo();
    lightGizmo.light = light;

    const gizmoManager = new GizmoManager(scene);
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = true;

    const urlParams = new URLSearchParams(window.location.search);
    const seed = urlParams.get("seed");

    const model = newSeededTelluricPlanetModel(
        "telluricPlanet",
        seed !== null ? Number(seed) : Math.random() * 1000,
        "Gas Planet",
        [],
    );
    addToWindow("model", model);

    const material = new TelluricPlanetMaterial(
        model,
        textures.terrains,
        textures.pools.telluricPlanetMaterialLut,
        scene,
    );
    addToWindow("material", material);

    const terraceElevation = model.atmosphere !== null ? 1e3 : 0;

    let cratersOctaveCount = 3;
    let cratersSparsity = 2;
    let erosion = 0;
    if (model.atmosphere !== null) {
        // atmosphere prevent smaller rocks from reaching the surface
        cratersOctaveCount -= 1;

        // assume past oceanic activity has eroded the surface
        erosion = 1;
    }

    let continentalCrustFraction = 1;

    if (model.ocean !== null) {
        // geological activity recycles craters
        cratersOctaveCount -= 1;
        cratersSparsity *= 2;
        continentalCrustFraction = 0.3;
    }

    const terrainModel: TerrainModel = {
        type: "procedural",
        seed: model.seed,
        continentalCrust: { elevation: model.ocean?.depth ?? 5e3, fraction: continentalCrustFraction },
        mountain: {
            elevation: 10e3,
            terraceElevation: terraceElevation,
            erosion: erosion,
        },
        craters: {
            octaveCount: cratersOctaveCount,
            sparsity: cratersSparsity,
        },
    };

    const terrain = new SphericalHeightFieldTerrain(
        "SphericalHeightFieldTerrain",
        model.radius,
        terrainModel,
        material,
        scene,
    );

    const heightMapAtlas = new PlanetHeightMapAtlas(heightMaps, scene);

    const chunkForgeResult = await ChunkForgeCompute.New(6, 64, heightMapAtlas, engine);
    if (!chunkForgeResult.success) {
        throw new Error(`Failed to create chunk forge: ${String(chunkForgeResult.error)}`);
    }

    const chunkForge = chunkForgeResult.value;

    let ocean: OceanPostProcess | null = null;
    if (model.ocean !== null) {
        const oceanUniforms = new OceanUniforms(model.radius, model.ocean.depth);

        ocean = new OceanPostProcess(
            terrain.getTransform(),
            model.radius + model.ocean.depth,
            oceanUniforms,
            [light],
            textures.water,
            scene,
        );
        camera.attachPostProcess(ocean);
    }

    let clouds: FlatCloudsPostProcess | null = null;
    if (model.clouds !== null) {
        const cloudsUniforms = new CloudsUniforms(model.clouds, textures.pools.cloudsLut, scene);

        clouds = new FlatCloudsPostProcess(
            terrain.getTransform(),
            model.radius + (model.ocean?.depth ?? 0),
            cloudsUniforms,
            [light],
            scene,
        );
        camera.attachPostProcess(clouds);
    }

    if (model.atmosphere !== null) {
        const atmosphereUniforms = new AtmosphereUniforms(model.radius, model.mass, 298, model.atmosphere);

        const atmosphere = new AtmosphericScatteringPostProcess(
            terrain.getTransform(),
            model.radius + (model.ocean?.depth ?? 0),
            atmosphereUniforms,
            [light],
            scene,
        );
        camera.attachPostProcess(atmosphere);
    }

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        controls.update(deltaSeconds);

        terrain.update(camera, chunkForge);
        chunkForge.update();

        const cameraPosition = camera.globalPosition.clone();
        terrain.getTransform().position.subtractInPlace(cameraPosition);
        controls.getTransform().position.subtractInPlace(cameraPosition);

        material.update(terrain.getTransform().computeWorldMatrix(true), [light]);

        ocean?.update(deltaSeconds);
        clouds?.update(deltaSeconds);
    });

    await new Promise<void>((resolve) => {
        const observer = engine.onBeginFrameObservable.add(() => {
            terrain.update(camera, chunkForge);
            chunkForge.update();

            if (terrain.isIdle()) {
                observer.remove();
                resolve();
            }
        });
    });

    return scene;
}
