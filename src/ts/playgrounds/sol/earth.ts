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
    Color3,
    GizmoManager,
    Light,
    LightGizmo,
    PBRMetallicRoughnessMaterial,
    PointLight,
    Scene,
    Vector3,
    type WebGPUEngine,
} from "@babylonjs/core";

import { getEarthModel } from "@/backend/universe/customSystems/sol/earth";
import { type TerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { PlanetHeightMapAtlas } from "@/frontend/assets/planetHeightMapAtlas";
import { loadTextures } from "@/frontend/assets/textures";
import { loadHeightMaps } from "@/frontend/assets/textures/heightmaps";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { AtmosphereUniforms } from "@/frontend/postProcesses/atmosphere/atmosphereUniforms";
import { AtmosphericScatteringPostProcess } from "@/frontend/postProcesses/atmosphere/atmosphericScatteringPostProcess";
import { CloudsUniforms } from "@/frontend/postProcesses/clouds/cloudsUniforms";
import { FlatCloudsPostProcess } from "@/frontend/postProcesses/clouds/flatCloudsPostProcess";
import { OceanPostProcess } from "@/frontend/postProcesses/ocean/oceanPostProcess";
import { OceanUniforms } from "@/frontend/postProcesses/ocean/oceanUniforms";
import { ChunkForgeCompute } from "@/frontend/terrain/sphere/chunkForgeCompute";
import { SphericalHeightFieldTerrain } from "@/frontend/terrain/sphere/sphericalHeightFieldTerrain";

export async function createEarthScene(
    engine: WebGPUEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.defaultCursor = "default";

    const textures = await loadTextures(scene, progressMonitor);

    const heightMaps = await loadHeightMaps(scene, progressMonitor);

    const earthModel = getEarthModel([]);

    const earthRadius = earthModel.radius; // Average radius of Earth in meters

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

    const depthRenderer = scene.enableDepthRenderer(null, true, true);
    depthRenderer.clearColor.set(0, 0, 0, 1);

    const light = new PointLight("light", new Vector3(10, 2, -10).normalize().scale(earthRadius * 10), scene);
    light.falloffType = Light.FALLOFF_STANDARD;

    const gizmo = new LightGizmo();
    gizmo.light = light;

    const gizmoManager = new GizmoManager(scene);
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = true;
    gizmoManager.boundingBoxGizmoEnabled = true;
    gizmoManager.usePointerToAttachGizmos = false;
    //gizmoManager.attachToMesh(lightGizmo.attachedMesh);

    const material = new PBRMetallicRoughnessMaterial("terrainMaterial", scene);
    material.baseColor = new Color3(0.5, 0.5, 0.5);
    material.metallic = 0.0;
    material.roughness = 1.0;

    const terrainModel: TerrainModel = {
        type: "custom",
        heightRange: {
            min: -11e3,
            max: 8.6e3,
        },
        id: "earth",
    };

    const terrain = new SphericalHeightFieldTerrain(
        "SphericalHeightFieldTerrain",
        earthRadius,
        terrainModel,
        material,
        scene,
    );

    const heightMapAtlas = new PlanetHeightMapAtlas(heightMaps, scene);

    await heightMapAtlas.loadHeightMapsToGpu([terrainModel.id]);

    const chunkForgeResult = await ChunkForgeCompute.New(6, 64, heightMapAtlas, engine);
    if (!chunkForgeResult.success) {
        throw new Error(`Failed to create chunk forge: ${String(chunkForgeResult.error)}`);
    }

    const chunkForge = chunkForgeResult.value;

    const oceanUniforms = new OceanUniforms(earthRadius, 0);
    const ocean = new OceanPostProcess(
        terrain.getTransform(),
        earthRadius,
        oceanUniforms,
        [light],
        textures.water,
        scene,
    );
    camera.attachPostProcess(ocean);

    const cloudsUniforms = new CloudsUniforms(earthModel.clouds, textures.pools.cloudsLut, scene);
    const cloudsPostProcess = new FlatCloudsPostProcess(
        terrain.getTransform(),
        earthRadius,
        cloudsUniforms,
        [light],
        scene,
    );
    camera.attachPostProcess(cloudsPostProcess);

    const atmosphereUniforms = new AtmosphereUniforms(earthRadius, earthModel.mass, 298, earthModel.atmosphere);
    const atmospherePostProcess = new AtmosphericScatteringPostProcess(
        terrain.getTransform(),
        earthRadius,
        atmosphereUniforms,
        [light],
        scene,
    );
    camera.attachPostProcess(atmospherePostProcess);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        controls.update(deltaSeconds);

        terrain.update(camera.globalPosition, material, chunkForge);
        chunkForge.update();

        ocean.update(deltaSeconds);

        const cameraPosition = camera.globalPosition.clone();
        terrain.getTransform().position.subtractInPlace(cameraPosition);
        light.position.subtractInPlace(cameraPosition);
        controls.getTransform().position.subtractInPlace(cameraPosition);
    });

    return scene;
}
