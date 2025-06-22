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
    DirectionalLight,
    GizmoManager,
    LightGizmo,
    PBRMetallicRoughnessMaterial,
    Scene,
    Vector3,
    WebGPUEngine,
} from "@babylonjs/core";

import { TerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import { PlanetHeightMapAtlas } from "@/frontend/assets/planetHeightMapAtlas";
import { loadTextures } from "@/frontend/assets/textures";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { ChunkForgeCompute } from "@/frontend/terrain/sphere/chunkForgeCompute";
import { SphericalHeightFieldTerrain } from "@/frontend/terrain/sphere/sphericalHeightFieldTerrain";

export async function createSphericalHeightFieldTerrain(
    engine: WebGPUEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.defaultCursor = "default";

    const textures = await loadTextures((loadedCount, totalCount, lastItemName) => {
        progressCallback(loadedCount / totalCount, `Loading textures: ${lastItemName} (${loadedCount}/${totalCount})`);
    }, scene);

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

    const light = new DirectionalLight("light", new Vector3(-5, 2, -10).normalize(), scene);
    light.position = new Vector3(0, 100, 0);

    const lightGizmo = new LightGizmo();
    lightGizmo.light = light;
    lightGizmo.attachedMesh?.position.set(0, 20, 0);

    const gizmoManager = new GizmoManager(scene);
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = true;
    gizmoManager.boundingBoxGizmoEnabled = true;
    gizmoManager.usePointerToAttachGizmos = false;
    gizmoManager.attachToMesh(lightGizmo.attachedMesh);

    const material = new PBRMetallicRoughnessMaterial("terrainMaterial", scene);
    material.baseColor = new Color3(0.5, 0.5, 0.5);
    material.metallic = 0.0;
    material.roughness = 1.0;

    const terrainModel: TerrainModel = {
        type: "custom",
        heightRange: {
            min: 0,
            max: 9e3,
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

    const heightMapAtlas = new PlanetHeightMapAtlas(textures.heightMaps, scene);

    heightMapAtlas.loadHeightMapsToGpu([terrainModel.id]);

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
    });

    progressCallback(1, "Loaded terrain scene");

    return scene;
}
