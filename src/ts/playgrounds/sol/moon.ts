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
    Axis,
    GizmoManager,
    HemisphericLight,
    Light,
    LightGizmo,
    PointLight,
    Scene,
    Vector3,
    type WebGPUEngine,
} from "@babylonjs/core";

import { getMoonModel } from "@/backend/universe/customSystems/sol/moon";
import { type TerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { PlanetHeightMapAtlas } from "@/frontend/assets/planetHeightMapAtlas";
import { loadHeightMaps } from "@/frontend/assets/textures/heightmaps";
import {
    loadMoonAlbedo,
    loadMoonHighResolutionAlbedo,
    loadMoonNormal,
} from "@/frontend/assets/textures/planetSurfaceTextures/moon";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { ChunkForgeCompute } from "@/frontend/terrain/sphere/chunkForgeCompute";
import { CustomPlanetMaterial } from "@/frontend/terrain/sphere/materials/customPlanetMaterial";
import { SphericalHeightFieldTerrain } from "@/frontend/terrain/sphere/sphericalHeightFieldTerrain";

import { type Texture2dUv } from "@/utils/texture";

export async function createMoonScene(
    engine: WebGPUEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.defaultCursor = "default";
    scene.clearColor.set(0, 0, 0, 1);

    const heightMaps = await loadHeightMaps(scene, progressMonitor);

    const moonModel = getMoonModel([]);

    const moonRadius = moonModel.radius;

    // This creates and positions a free camera (non-mesh)
    const controls = new DefaultControls(scene);
    controls.getTransform().position = new Vector3(0, 0, -10).normalize().scale(moonRadius * 3);
    controls.getTransform().lookAt(Vector3.Zero());
    controls.speed = moonRadius / 3;

    const camera = controls.getActiveCamera();
    camera.minZ = 0.01;
    camera.maxZ = 0.0;

    // This attaches the camera to the canvas
    camera.attachControl();

    scene.activeCamera = camera;

    const depthRenderer = scene.enableDepthRenderer(null, true, true);
    depthRenderer.clearColor.set(0, 0, 0, 1);

    const light = new PointLight("light", new Vector3(0, 0, -10).normalize().scale(moonRadius * 10), scene);
    light.falloffType = Light.FALLOFF_STANDARD;
    light.intensity = 4;

    const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
    ambient.intensity = 0.001;

    const gizmo = new LightGizmo();
    gizmo.light = light;

    const gizmoManager = new GizmoManager(scene);
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = true;

    const useHighQuality = new URLSearchParams(window.location.search).get("light") === null;

    let albedoBslTexture: Texture2dUv;

    if (useHighQuality) {
        const albedoResult = await loadMoonHighResolutionAlbedo(scene, engine, progressMonitor);
        if (!albedoResult.success) {
            throw new Error(`Failed to load high-resolution albedo texture: ${String(albedoResult.error)}`);
        }

        albedoBslTexture = albedoResult.value;
    } else {
        albedoBslTexture = { type: "texture_2d", texture: await loadMoonAlbedo(scene, progressMonitor) };
    }

    const normal = await loadMoonNormal(scene, progressMonitor);

    const material = new CustomPlanetMaterial(albedoBslTexture, { type: "texture_2d", texture: normal }, scene);

    const terrainModel: TerrainModel = {
        type: "custom",
        heightRange: {
            min: -9_178, // see https://en.wikipedia.org/wiki/Antoniadi_%28lunar_crater%29
            max: 10_786, // see https://lunarnetworks.blogspot.com/2010/10/lroc-highest-point-on-moon.html
        },
        id: "moon",
    };

    const terrain = new SphericalHeightFieldTerrain(
        "SphericalHeightFieldTerrain",
        moonRadius,
        terrainModel,
        material.get(),
        scene,
    );
    terrain.getTransform().rotate(Axis.Y, Math.PI / 2);

    const heightMapAtlas = new PlanetHeightMapAtlas(heightMaps, scene);

    if (useHighQuality) {
        await heightMapAtlas.loadHeightMapsToGpu([terrainModel.id], progressMonitor);
    }

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

    await new Promise<void>((resolve) => {
        const observer = engine.onBeginFrameObservable.add(() => {
            terrain.update(camera.globalPosition, material.get(), chunkForge);
            chunkForge.update();

            if (terrain.isIdle()) {
                observer.remove();
                resolve();
            }
        });
    });

    return scene;
}
