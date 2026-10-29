//  This file is part of Cosmos Journeyer
//  SPDX-License-Identifier: AGPL-3.0-only

import { FreeCamera, Scene, Vector3 } from "@babylonjs/core";
import type { AbstractEngine } from "@babylonjs/core";
import { generateTelluricPlanetModel } from "@cosmos-journeyer/universe-generation";

import { getSunModel } from "@/backend/universe/customSystems/sol/sun";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { TerrainSystemGpu } from "@/frontend/universe/planets/telluricPlanet/terrain/system/terrainSystemGpu";

import { Settings } from "@/settings";

// Heights are in metres above the planet's reference radius; rows run north to south.
declare global {
    interface Window {
        terrainHeightmap: { width: number; height: number; heights: Float32Array; seaLevel: number };
    }
}

/**
 * Samples the game's terrain compute shader over a complete equirectangular map.
 * @param engine Rendering engine.
 * @param progressMonitor Loading progress for the compute task.
 * @returns An unlit elevation map with a fixed scale of -10 to +10 km relative to sea level.
 */
export async function createTerrainHeightmapScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine);
    new FreeCamera("heightmapCamera", new Vector3(0, 0, -2), scene);

    const params = new URLSearchParams(window.location.search);
    const seed = Number(params.get("seed") ?? 261);
    const planetModel = generateTelluricPlanetModel("heightmap", seed, "Heightmap", [getSunModel()]);
    const seaLevel = planetModel.ocean?.depth ?? 0;
    const width = 512;
    const height = width / 2;
    const coordinates = Array.from({ length: width * height }, (_, index) => ({
        latitude: Math.PI / 2 - (Math.floor(index / width) / (height - 1)) * Math.PI,
        longitude: ((index % width) / (width - 1)) * Math.PI * 2 - Math.PI,
    }));
    const terrainResult = TerrainSystemGpu.New(engine, Settings.VERTEX_RESOLUTION);
    if (!terrainResult.success) {
        throw terrainResult.error;
    }
    const terrain = terrainResult.value;
    progressMonitor.startTask();
    const taskId = terrain.requestHeights({ planetModel, coordinates });
    const heights = await new Promise<Float32Array>((resolve, reject) => {
        const observer = engine.onBeginFrameObservable.add(() => {
            terrain.update();
            const output = terrain.getHeightsOutput(taskId);
            if (output === undefined || output.status === "pending") {
                return;
            }
            engine.onBeginFrameObservable.remove(observer);
            if (output.status === "failed") {
                reject(new Error("Terrain heightmap computation failed"));
            } else {
                resolve(output.heights);
            }
        });
    });
    terrain.reset();
    progressMonitor.completeTask();

    const map = document.createElement("canvas");
    map.id = "terrain-heightmap";
    map.width = width;
    map.height = height;
    Object.assign(map.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(100vw, 200vh)",
        height: "auto",
        imageRendering: "pixelated",
    });
    const context = map.getContext("2d");
    if (context === null) {
        throw new Error("Could not create the heightmap canvas");
    }
    const image = context.createImageData(width, height);
    for (const [index, elevation] of heights.entries()) {
        if (!Number.isFinite(elevation)) {
            throw new Error(`Non-finite terrain elevation at pixel ${index}`);
        }
        const intensity = Math.round(Math.max(0, Math.min(1, (elevation - seaLevel + 10_000) / 20_000)) * 255);
        image.data.set([intensity, intensity, intensity, 255], index * 4);
    }
    context.putImageData(image, 0, 0);
    document.body.appendChild(map);

    const label = document.createElement("div");
    label.textContent = `Seed ${seed} · Elevation −10 → +10 km · North ↑ · West −180° → East +180°`;
    Object.assign(label.style, {
        position: "fixed",
        top: "12px",
        left: "12px",
        color: "white",
        fontFamily: "monospace",
    });
    document.body.appendChild(label);
    window.terrainHeightmap = { width, height, heights, seaLevel };
    scene.onDisposeObservable.addOnce(() => {
        map.remove();
        label.remove();
        Reflect.deleteProperty(window, "terrainHeightmap");
    });
    return scene;
}
