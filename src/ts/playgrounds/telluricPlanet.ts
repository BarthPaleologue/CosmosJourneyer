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

import { GizmoManager, Light, LightGizmo, PointLight, Scene, Vector3, type WebGPUEngine } from "@babylonjs/core";

import { type TerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";
import { newSeededTelluricPlanetModel } from "@/backend/universe/proceduralGenerators/telluricPlanetModelGenerator";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { PlanetHeightMapAtlas } from "@/frontend/assets/planetHeightMapAtlas";
import { loadTextures } from "@/frontend/assets/textures";
import { loadHeightMaps } from "@/frontend/assets/textures/heightMaps";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { ChunkForgeCompute } from "@/frontend/terrain/sphere/chunkForgeCompute";
import { SphericalHeightFieldTerrain } from "@/frontend/terrain/sphere/sphericalHeightFieldTerrain";
import { TelluricPlanetMaterial } from "@/frontend/universe/planets/telluricPlanet/telluricPlanetMaterial";

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

    const material = new TelluricPlanetMaterial(
        model,
        textures.terrains,
        textures.pools.telluricPlanetMaterialLut,
        scene,
    );

    const terrainModel: TerrainModel = {
        type: "procedural",
    };

    const terrain = new SphericalHeightFieldTerrain(
        "SphericalHeightFieldTerrain",
        earthRadius,
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

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        controls.update(deltaSeconds);

        terrain.update(camera.globalPosition, material, chunkForge);
        chunkForge.update();

        const cameraPosition = camera.globalPosition.clone();
        terrain.getTransform().position.subtractInPlace(cameraPosition);
        controls.getTransform().position.subtractInPlace(cameraPosition);

        material.update(terrain.getTransform().computeWorldMatrix(true), [light]);
    });

    return scene;
}
