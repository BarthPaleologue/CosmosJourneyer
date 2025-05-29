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
    Mesh,
    PBRMetallicRoughnessMaterial,
    Scene,
    ShadowGenerator,
    Vector3,
    VertexData,
    type WebGPUEngine,
} from "@babylonjs/core";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { PlanarProceduralHeightField } from "@/frontend/terrain/planarProceduralHeightField";

export async function createTerrainScene(
    engine: WebGPUEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
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

    const generator = new PlanarProceduralHeightField(engine);

    const t0 = performance.now();
    const { positions: positionsBuffer, indices: indicesBuffer } = await generator.dispatch(
        nbVerticesPerRow,
        size,
        engine,
    );
    const t1 = performance.now();
    console.log("Height field generation:", t1 - t0, "ms");

    /*const normalComputer = new SquareGridNormalComputer(engine);
    const normalsGpu = await normalComputer.dispatch(nbVerticesPerRow, positions, engine);
    const normalsGpuOnCpu = new Float32Array((await normalsGpu.read()).buffer);*/

    const positionsBufferView = await positionsBuffer.read();
    const indicesBufferView = await indicesBuffer.read();

    const positions = new Float32Array(positionsBufferView.buffer);
    const indices = new Uint32Array(indicesBufferView.buffer);

    const normals = new Float32Array(nbVerticesPerRow * nbVerticesPerRow * 3);
    VertexData.ComputeNormals(positions, indices, normals);

    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;

    vertexData.applyToMesh(terrain);

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

    return scene;
}
