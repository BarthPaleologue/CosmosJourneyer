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
    ComputeShader,
    DirectionalLight,
    GizmoManager,
    LightGizmo,
    Mesh,
    PBRMetallicRoughnessMaterial,
    ShadowGenerator,
    StorageBuffer,
    UniformBuffer,
    Vector3,
    VertexData,
    WebGPUEngine,
} from "@babylonjs/core";
import { Scene } from "@babylonjs/core/scene";

import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";

import heightMapComputeSource from "@shaders/compute/terrain/planarProceduralHeightField.wgsl";

export async function computeVertexData2(
    nbVerticesPerRow: number,
    size: number,
    engine: WebGPUEngine,
): Promise<VertexData> {
    const numOctaves = 2;
    const lacunarity = 2.0;
    const persistence = 0.5;
    const initialScale = 0.5;

    const computeShader = new ComputeShader(
        "heightMap",
        engine,
        { computeSource: heightMapComputeSource },
        {
            bindingsMapping: {
                positions: { group: 0, binding: 0 },
                indices: { group: 0, binding: 1 },
                params: { group: 0, binding: 2 },
            },
        },
    );

    const positions = new Float32Array(nbVerticesPerRow * nbVerticesPerRow * 3);
    const normals = new Float32Array(nbVerticesPerRow * nbVerticesPerRow * 3);
    const indices = new Uint32Array((nbVerticesPerRow - 1) * (nbVerticesPerRow - 1) * 6);

    const positionsBuffer = new StorageBuffer(engine, positions.byteLength);
    positionsBuffer.update(positions);
    computeShader.setStorageBuffer("positions", positionsBuffer);

    const indicesBuffer = new StorageBuffer(engine, indices.byteLength);
    indicesBuffer.update(indices);
    computeShader.setStorageBuffer("indices", indicesBuffer);

    const paramsBuffer = new UniformBuffer(engine);

    paramsBuffer.addUniform("nbVerticesPerRow", 1);
    paramsBuffer.addUniform("size", 1);
    paramsBuffer.addUniform("octaves", 1);
    paramsBuffer.addUniform("lacunarity", 1);
    paramsBuffer.addUniform("persistence", 1);
    paramsBuffer.addUniform("scaleFactor", 1);

    paramsBuffer.updateUInt("nbVerticesPerRow", nbVerticesPerRow);
    paramsBuffer.updateFloat("size", size);
    paramsBuffer.updateInt("octaves", numOctaves);
    paramsBuffer.updateFloat("lacunarity", lacunarity);
    paramsBuffer.updateFloat("persistence", persistence);
    paramsBuffer.updateFloat("scaleFactor", initialScale);
    paramsBuffer.update();

    computeShader.setUniformBuffer("params", paramsBuffer);

    return new Promise((resolve) => {
        computeShader
            .dispatchWhenReady(nbVerticesPerRow, nbVerticesPerRow, 1)
            .then(async () => {
                try {
                    const [positionsBufferView, indicesBufferView] = await Promise.all([
                        positionsBuffer.read(),
                        indicesBuffer.read(),
                    ]);

                    const positions = new Float32Array(positionsBufferView.buffer);
                    positionsBuffer.dispose();

                    const indices = new Uint32Array(indicesBufferView.buffer);
                    indicesBuffer.dispose();

                    VertexData.ComputeNormals(positions, indices, normals);

                    const vertexData = new VertexData();
                    vertexData.positions = positions;
                    vertexData.indices = indices;
                    vertexData.normals = normals;

                    resolve(vertexData);
                } catch (error) {
                    console.error("Error reading buffers:", error);
                }
            })
            .catch((error: unknown) => {
                console.error("Error dispatching compute shader:", error);
            });
    });
}

export async function createTerrainScene(
    engine: WebGPUEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.defaultCursor = "default";

    // This creates and positions a free camera (non-mesh)
    const controls = new DefaultControls(scene);
    controls.getTransform().position = new Vector3(0, 5, -10).scale(5);
    controls.getTransform().lookAt(Vector3.Zero());

    const camera = controls.getActiveCamera();

    // This attaches the camera to the canvas
    camera.attachControl();

    scene.activeCamera = camera;

    const light = new DirectionalLight("light", new Vector3(-5, -2, 10).normalize(), scene);
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

    const shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.bias = 0.0001;

    const nbVerticesPerRow = 512;
    const size = 8;

    const terrain = new Mesh("terrain", scene);

    const t0 = performance.now();

    const vertexData = await computeVertexData2(nbVerticesPerRow, size, engine);
    vertexData.applyToMesh(terrain);

    const t1 = performance.now();
    console.log("Terrain generation:", t1 - t0, "ms");

    const terrainMat = new PBRMetallicRoughnessMaterial("terrainMat", scene);
    terrainMat.baseColor = new Color3(0.5, 0.5, 0.5);
    terrainMat.metallic = 0.0;
    terrainMat.roughness = 0.8;
    terrain.material = terrainMat;

    terrain.scaling.scaleInPlace(10);

    terrain.receiveShadows = true;
    shadowGenerator.addShadowCaster(terrain);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        controls.update(deltaSeconds);
    });

    progressCallback(1, "Loaded terrain scene");

    return scene;
}
