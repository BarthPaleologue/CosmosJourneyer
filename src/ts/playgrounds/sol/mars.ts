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
    Light,
    LightGizmo,
    PointLight,
    Scene,
    Texture,
    Vector3,
    type WebGPUEngine,
} from "@babylonjs/core";

import { getMarsModel } from "@/backend/universe/customSystems/sol/mars";
import { type TerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { PlanetHeightMapAtlas } from "@/frontend/assets/planetHeightMapAtlas";
import { loadHeightMaps } from "@/frontend/assets/textures/heightmaps";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { AtmosphereUniforms } from "@/frontend/postProcesses/atmosphere/atmosphereUniforms";
import { AtmosphericScatteringPostProcess } from "@/frontend/postProcesses/atmosphere/atmosphericScatteringPostProcess";
import { ChunkForgeCompute } from "@/frontend/terrain/sphere/chunkForgeCompute";
import { CustomPlanetMaterial } from "@/frontend/terrain/sphere/materials/customPlanetMaterial";
import { SphericalHeightFieldTerrain } from "@/frontend/terrain/sphere/sphericalHeightFieldTerrain";

import { type BslTexture2dUv } from "@/utils/bslExtensions";
import { createRawTexture2DArrayFromUrls, createTextureAsync } from "@/utils/texture";

import marsAlbedoPath from "@assets/sol/textures/marsColor8k.png";
import marsAlbedoPath_0_0 from "@assets/sol/textures/marsColorMap2x4/0_0.png";
import marsAlbedoPath_0_1 from "@assets/sol/textures/marsColorMap2x4/0_1.png";
import marsAlbedoPath_0_2 from "@assets/sol/textures/marsColorMap2x4/0_2.png";
import marsAlbedoPath_0_3 from "@assets/sol/textures/marsColorMap2x4/0_3.png";
import marsAlbedoPath_1_0 from "@assets/sol/textures/marsColorMap2x4/1_0.png";
import marsAlbedoPath_1_1 from "@assets/sol/textures/marsColorMap2x4/1_1.png";
import marsAlbedoPath_1_2 from "@assets/sol/textures/marsColorMap2x4/1_2.png";
import marsAlbedoPath_1_3 from "@assets/sol/textures/marsColorMap2x4/1_3.png";
import marsNormalPath from "@assets/sol/textures/marsNormalMap8k.png";

export async function createMarsScene(
    engine: WebGPUEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.defaultCursor = "default";
    scene.clearColor.set(0, 0, 0, 1);

    const heightMaps = await loadHeightMaps(scene, progressMonitor);

    const marsModel = getMarsModel([]);

    const marsRadius = marsModel.radius;

    // This creates and positions a free camera (non-mesh)
    const controls = new DefaultControls(scene);
    controls.getTransform().position = new Vector3(0, 5, -10).normalize().scale(marsRadius * 3);
    controls.getTransform().lookAt(Vector3.Zero());
    controls.speed = marsRadius / 3;

    const camera = controls.getActiveCamera();
    camera.minZ = 0.01;
    camera.maxZ = 0.0;

    // This attaches the camera to the canvas
    camera.attachControl();

    scene.activeCamera = camera;

    const depthRenderer = scene.enableDepthRenderer(null, true, true);
    depthRenderer.clearColor.set(0, 0, 0, 1);

    const light = new PointLight("light", new Vector3(-5, 2, -10).normalize().scale(marsRadius * 10), scene);
    light.falloffType = Light.FALLOFF_STANDARD;
    light.intensity = 4;

    const gizmo = new LightGizmo();
    gizmo.light = light;

    const gizmoManager = new GizmoManager(scene);
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = true;
    gizmoManager.boundingBoxGizmoEnabled = true;
    gizmoManager.usePointerToAttachGizmos = false;

    const useHighQuality = new URLSearchParams(window.location.search).get("light") === null;

    let albedoBslTexture: BslTexture2dUv;

    if (useHighQuality) {
        const albedoResult = await createRawTexture2DArrayFromUrls(
            [
                marsAlbedoPath_0_0,
                marsAlbedoPath_0_1,
                marsAlbedoPath_0_2,
                marsAlbedoPath_0_3,
                marsAlbedoPath_1_0,
                marsAlbedoPath_1_1,
                marsAlbedoPath_1_2,
                marsAlbedoPath_1_3,
            ],
            scene,
            engine,
        );
        if (!albedoResult.success) {
            throw new Error(`Failed to create albedo texture array: ${String(albedoResult.error)}`);
        }

        const albedo = albedoResult.value;
        const addressMode = Texture.CLAMP_ADDRESSMODE;
        albedo.wrapU = addressMode;
        albedo.wrapV = addressMode;
        albedo.wrapR = addressMode;

        albedoBslTexture = {
            type: "texture_2d_array_mosaic",
            array: albedo,
            tileCount: { x: 4, y: 2 },
        };
    } else {
        albedoBslTexture = {
            type: "texture_2d",
            texture: await createTextureAsync(marsAlbedoPath, scene),
        };
    }
    const normal = await createTextureAsync(marsNormalPath, scene);

    const material = new CustomPlanetMaterial(albedoBslTexture, { type: "texture_2d", texture: normal }, scene);

    const terrainModel: TerrainModel = {
        type: "custom",
        heightRange: {
            min: 0,
            max: 8_201 + 21_241,
        },
        id: "mars",
    };

    const terrain = new SphericalHeightFieldTerrain(
        "SphericalHeightFieldTerrain",
        marsRadius,
        terrainModel,
        material.get(),
        scene,
    );
    terrain.getTransform().rotate(Axis.Y, Math.PI);

    const heightMapAtlas = new PlanetHeightMapAtlas(heightMaps, scene);

    await heightMapAtlas.loadHeightMapsToGpu([terrainModel.id]);

    const chunkForgeResult = await ChunkForgeCompute.New(6, 64, heightMapAtlas, engine);
    if (!chunkForgeResult.success) {
        throw new Error(`Failed to create chunk forge: ${String(chunkForgeResult.error)}`);
    }

    const chunkForge = chunkForgeResult.value;

    const atmosphereUniforms = new AtmosphereUniforms(marsRadius, marsModel.mass, 298, marsModel.atmosphere);
    const atmospherePostProcess = new AtmosphericScatteringPostProcess(
        terrain.getTransform(),
        marsRadius,
        atmosphereUniforms,
        [light],
        scene,
    );
    camera.attachPostProcess(atmospherePostProcess);

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
