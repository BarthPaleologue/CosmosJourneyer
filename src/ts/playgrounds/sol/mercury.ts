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
    GizmoManager,
    Light,
    LightGizmo,
    PointLight,
    Scene,
    Texture,
    Vector3,
    type WebGPUEngine,
} from "@babylonjs/core";

import { getMercuryModel } from "@/backend/universe/customSystems/sol/mercury";
import { type TerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { PlanetHeightMapAtlas } from "@/frontend/assets/planetHeightMapAtlas";
import { loadHeightMaps } from "@/frontend/assets/textures/heightmaps";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { ChunkForgeCompute } from "@/frontend/terrain/sphere/chunkForgeCompute";
import { CustomPlanetMaterial } from "@/frontend/terrain/sphere/materials/customPlanetMaterial";
import { SphericalHeightFieldTerrain } from "@/frontend/terrain/sphere/sphericalHeightFieldTerrain";

import mercuryColorMapPath from "@assets/sol/textures/mercuryColor8k.png";
import mercuryNormalMapPath from "@assets/sol/textures/mercuryNormalMap8k.png";

export async function createMercuryScene(
    engine: WebGPUEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.defaultCursor = "default";
    scene.clearColor.set(0, 0, 0, 1);

    const heightMaps = await loadHeightMaps(scene, progressMonitor);

    const mercuryModel = getMercuryModel([]);

    const mercuryRadius = mercuryModel.radius;

    // This creates and positions a free camera (non-mesh)
    const controls = new DefaultControls(scene);
    controls.getTransform().position = new Vector3(0, 5, -10).normalize().scale(mercuryRadius * 3);
    controls.getTransform().lookAt(Vector3.Zero());
    controls.speed = mercuryRadius / 3;

    const camera = controls.getActiveCamera();
    camera.minZ = 0.01;
    camera.maxZ = 0.0;

    // This attaches the camera to the canvas
    camera.attachControl();

    scene.activeCamera = camera;

    const depthRenderer = scene.enableDepthRenderer(null, true, true);
    depthRenderer.clearColor.set(0, 0, 0, 1);

    const light = new PointLight("light", new Vector3(-5, 2, -10).normalize().scale(mercuryRadius * 10), scene);
    light.falloffType = Light.FALLOFF_STANDARD;
    light.intensity = 4;

    const gizmo = new LightGizmo();
    gizmo.light = light;

    const gizmoManager = new GizmoManager(scene);
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = true;
    gizmoManager.boundingBoxGizmoEnabled = true;
    gizmoManager.usePointerToAttachGizmos = false;

    const albedoMap = new Texture(mercuryColorMapPath, scene);
    const normalMap = new Texture(mercuryNormalMapPath, scene);

    const material = new CustomPlanetMaterial(
        { type: "texture_2d", texture: albedoMap },
        { type: "texture_2d", texture: normalMap },
        scene,
    );

    const terrainModel: TerrainModel = {
        type: "custom",
        heightRange: {
            // see https://www.jhuapl.edu/news/news-releases/160506-messenger-first-global-topographic-model-mercury
            min: -5_380,
            max: 4_480,
        },
        id: "mercury",
    };

    const terrain = new SphericalHeightFieldTerrain(
        "SphericalHeightFieldTerrain",
        mercuryRadius,
        terrainModel,
        material.get(),
        scene,
    );

    const heightMapAtlas = new PlanetHeightMapAtlas(heightMaps, scene);

    await heightMapAtlas.loadHeightMapsToGpu([terrainModel.id]);

    const chunkForgeResult = await ChunkForgeCompute.New(6, 64, heightMapAtlas, engine);
    if (!chunkForgeResult.success) {
        throw new Error(`Failed to create chunk forge: ${String(chunkForgeResult.error)}`);
    }

    const chunkForge = chunkForgeResult.value;

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        controls.update(deltaSeconds);

        terrain.update(camera.globalPosition, material.get(), chunkForge);
        chunkForge.update();

        const cameraPosition = camera.globalPosition.clone();
        terrain.getTransform().position.subtractInPlace(cameraPosition);
        light.position.subtractInPlace(cameraPosition);
        controls.getTransform().position.subtractInPlace(cameraPosition);

        material.setPlanetInverseWorld(terrain.getTransform().computeWorldMatrix(true).clone().invert());
    });

    return scene;
}
