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

import {
    DirectionalLight,
    MeshBuilder,
    PBRMetallicRoughnessMaterial,
    Quaternion,
    Scene,
    Vector3,
    type AbstractEngine,
} from "@babylonjs/core";
import { generateTelluricPlanetModel } from "@cosmos-journeyer/universe-generation";

import { getSunModel } from "@/backend/universe/customSystems/sol/sun";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { lookAt } from "@/frontend/helpers/transform";
import { ScatteringSystemMock } from "@/frontend/universe/planets/telluricPlanet/terrain/chunks/scatteringSystem";
import { SphericalHeightFieldTerrain } from "@/frontend/universe/planets/telluricPlanet/terrain/sphericalHeightFieldTerrain";
import { TerrainSystemCpu } from "@/frontend/universe/planets/telluricPlanet/terrain/system/terrainSystemCpu";

import { Settings } from "@/settings";

import { enablePhysics } from "./utils";

export async function createSphericalHeightFieldTerrainScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    const terrainSystemResult = await TerrainSystemCpu.New(Settings.VERTEX_RESOLUTION);
    if (!terrainSystemResult.success) {
        throw terrainSystemResult.error;
    }
    const terrainSystem = terrainSystemResult.value;

    const scatteringSystem = new ScatteringSystemMock();

    const scalingFactor = Settings.EARTH_RADIUS * 2;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    const urlParams = new URLSearchParams(window.location.search);
    const startingDistance = Number(urlParams.get("startingDistance") ?? scalingFactor * 1.5);

    controls.getTransform().setAbsolutePosition(new Vector3(0, 1, -2).normalize().scaleInPlace(startingDistance));
    lookAt(controls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);
    camera.attachControl();

    new DirectionalLight("light", new Vector3(-7, -5, 10).normalize(), scene);

    const seed = Number(urlParams.get("seed") ?? Math.floor(Math.random() * 1000));
    console.log("seed", seed);

    const telluricPlanetModel = generateTelluricPlanetModel("telluricPlanet", seed, "Telluric Planet", [getSunModel()]);

    const terrainMaterial = new PBRMetallicRoughnessMaterial("terrainMaterial", scene);
    terrainMaterial.metallic = 0;
    terrainMaterial.roughness = 0.7;
    terrainMaterial.baseColor.fromHexString("#505040");

    const terrain = new SphericalHeightFieldTerrain(telluricPlanetModel, terrainMaterial, scene);

    if (urlParams.has("sampledSurfaceCubes")) {
        const centerDirection = new Vector3(0, 1, -2).normalize();
        const tangentX = Vector3.Cross(Vector3.UpReadOnly, centerDirection).normalize();
        const tangentY = Vector3.Cross(centerDirection, tangentX).normalize();
        const gridRadius = 2;
        const cubeSize = telluricPlanetModel.radius * 0.005;
        const angularSpacing = (cubeSize / telluricPlanetModel.radius) * 2.5;
        const surfaceDirections: ReadonlyArray<Vector3> = Array.from(
            { length: (gridRadius * 2 + 1) ** 2 },
            (_, index) => {
                const x = (index % (gridRadius * 2 + 1)) - gridRadius;
                const y = Math.floor(index / (gridRadius * 2 + 1)) - gridRadius;
                return centerDirection
                    .add(tangentX.scale(x * angularSpacing))
                    .addInPlace(tangentY.scale(y * angularSpacing))
                    .normalize();
            },
        );
        const heightTaskId = terrainSystem.requestHeights({
            planetModel: telluricPlanetModel,
            coordinates: surfaceDirections.map((direction) => ({
                latitudeRadians: Math.asin(direction.y),
                longitudeRadians: Math.atan2(direction.z, direction.x),
            })),
        });

        const sampledHeights = await new Promise<Float32Array<ArrayBuffer>>((resolve, reject) => {
            const observer = engine.onBeginFrameObservable.add(() => {
                terrainSystem.update();

                const output = terrainSystem.getHeightsOutput(heightTaskId);
                if (output?.status !== "heightComputed") {
                    return;
                }

                engine.onBeginFrameObservable.remove(observer);
                if (output.heights.length !== surfaceDirections.length) {
                    reject(new Error("Terrain height sampling returned an unexpected number of heights"));
                    return;
                }

                resolve(output.heights);
            });
        });

        const cubeMaterial = new PBRMetallicRoughnessMaterial("sampledSurfaceCubesMaterial", scene);
        cubeMaterial.baseColor.set(1, 0, 0);
        cubeMaterial.emissiveColor.set(0.2, 0, 0);
        cubeMaterial.metallic = 0;
        cubeMaterial.roughness = 0.7;

        surfaceDirections.forEach((surfaceDirection, index) => {
            const sampledHeight = sampledHeights[index];
            if (sampledHeight === undefined) {
                return;
            }

            const surfacePosition = surfaceDirection.scale(telluricPlanetModel.radius + sampledHeight);
            const cube = MeshBuilder.CreateBox(`sampledSurfaceCube-${index}`, { size: cubeSize }, scene);
            cube.position.copyFrom(surfacePosition).addInPlace(surfaceDirection.scale(cubeSize / 2));
            cube.rotationQuaternion = Quaternion.FromUnitVectorsToRef(
                Vector3.UpReadOnly,
                surfaceDirection,
                Quaternion.Identity(),
            );
            cube.material = cubeMaterial;
        });

        const centerIndex = Math.floor(surfaceDirections.length / 2);
        const centerHeight = sampledHeights[centerIndex];
        if (centerHeight === undefined) {
            throw new Error("Terrain height sampling returned no center height");
        }
        const centerSurfacePosition = centerDirection.scale(telluricPlanetModel.radius + centerHeight);
        controls
            .getTransform()
            .setAbsolutePosition(
                centerSurfacePosition.add(centerDirection.scale(cubeSize * 5)).add(tangentY.scale(cubeSize * -16)),
            );
        lookAt(
            controls.getTransform(),
            centerSurfacePosition.add(centerDirection.scale(cubeSize / 2)),
            scene.useRightHandedSystem,
        );
    }

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);
        terrain.updateLOD(camera, terrainSystem, scatteringSystem);
        terrainSystem.update();
        terrain.computeCulling(camera);
    });

    await new Promise<void>((resolve) => {
        const observer = engine.onBeginFrameObservable.add(() => {
            controls.update(0);
            terrain.updateLOD(camera, terrainSystem, scatteringSystem);
            terrainSystem.update();
            terrain.computeCulling(camera);

            if (terrainSystem.isIdle() && terrain.isIdle()) {
                engine.onBeginFrameObservable.remove(observer);
                resolve();
            }
        });
    });

    return scene;
}
