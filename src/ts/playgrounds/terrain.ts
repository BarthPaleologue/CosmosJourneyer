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
    BoundingInfo,
    Color3,
    DirectionalLight,
    GizmoManager,
    LightGizmo,
    Mesh,
    PBRMetallicRoughnessMaterial,
    Scene,
    ShadowGenerator,
    Vector3,
    VertexBuffer,
    VertexData,
    type WebGPUEngine,
} from "@babylonjs/core";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { PlanarProceduralHeightField } from "@/frontend/terrain/planarProceduralHeightField";
import { SquareGridNormalComputer } from "@/frontend/terrain/squareGridNormalComputer";

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

    const nbVerticesPerRow = 1024;
    const size = 8;

    const terrain = new Mesh("terrain", scene);

    const generator = await PlanarProceduralHeightField.New(engine);
    const normalComputer = await SquareGridNormalComputer.New(engine);

    const { positions: positionBuffer, indices: indexBuffer } = generator.dispatch(nbVerticesPerRow, size, engine);
    const normalBuffer = normalComputer.dispatch(nbVerticesPerRow, positionBuffer, engine);

    const keepDataOnGPU = true;

    if (keepDataOnGPU) {
        const positionsVertexBuffer = new VertexBuffer(engine, positionBuffer.getBuffer(), "position", false, false, 3);
        terrain.setVerticesBuffer(positionsVertexBuffer);

        const normalsVertexBuffer = new VertexBuffer(engine, normalBuffer.getBuffer(), "normal", false, false, 3);
        terrain.setVerticesBuffer(normalsVertexBuffer);
        terrain.setBoundingInfo(new BoundingInfo(new Vector3(-size, -size, -size), new Vector3(size, size, size)));

        terrain.setIndexBuffer(
            indexBuffer.getBuffer(),
            nbVerticesPerRow * nbVerticesPerRow,
            (nbVerticesPerRow - 1) * (nbVerticesPerRow - 1) * 6,
        );
    } else {
        const positionBufferView = await positionBuffer.read();
        const indexBufferView = await indexBuffer.read();
        const normalBufferView = await normalBuffer.read();

        const vertexData = new VertexData();
        vertexData.positions = new Float32Array(positionBufferView.buffer);
        vertexData.indices = new Uint32Array(indexBufferView.buffer);
        vertexData.normals = new Float32Array(normalBufferView.buffer);

        vertexData.applyToMesh(terrain);
    }

    const terrainMat = new PBRMetallicRoughnessMaterial("terrainMat", scene);
    terrainMat.baseColor = new Color3(0.5, 1.0, 0.5);
    terrainMat.metallic = 0.0;
    terrainMat.roughness = 0.8;
    terrain.material = terrainMat;

    terrain.scaling.scaleInPlace(10);
    terrain.scaling.y *= 2;

    terrain.receiveShadows = true;
    shadowGenerator.addShadowCaster(terrain);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        controls.update(deltaSeconds);
    });

    return scene;
}
