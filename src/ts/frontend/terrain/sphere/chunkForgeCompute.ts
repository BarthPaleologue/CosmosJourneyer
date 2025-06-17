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

import { type StorageBuffer } from "@babylonjs/core/Buffers/storageBuffer";
import { type WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

import {
    type CustomTerrainModel,
    type ProceduralTerrainModel,
    type TerrainModel,
} from "@/backend/universe/orbitalObjects/terrainModel";

import { type IPlanetHeightMapAtlas } from "@/frontend/assets/planetHeightMapAtlas";

import { type Direction } from "@/utils/direction";

import { SquareGridIndicesComputer } from "../squareGridIndexComputer";
import { SquareGridNormalComputer } from "../squareGridNormalComputer";
import { SphericalProceduralHeightFieldBuilder } from "./sphericalProceduralHeightFieldBuilder";
import { SphericalTextureHeightFieldBuilder } from "./sphericalTextureHeightFieldBuilder";

type HeightFieldTask = {
    onFinish: (output: ChunkForgeOutput) => void;
    positionOnCube: Vector3;
    positionOnSphere: Vector3;
    size: number;
    direction: Direction;
    sphereRadius: number;
    terrainModel: TerrainModel;
};

type ProceduralHeightFieldTask = HeightFieldTask & {
    terrainModel: ProceduralTerrainModel;
};

type TextureHeightFieldTask = HeightFieldTask & {
    terrainModel: CustomTerrainModel;
};

type NormalTask = {
    onFinish: (output: ChunkForgeOutput) => void;
    positions: StorageBuffer;
};

type ApplyTask = {
    onFinish: (output: ChunkForgeOutput) => void;
    positions: StorageBuffer;
    normals: StorageBuffer;
};

export type ChunkForgeOutput = {
    cpu: VertexData;
    gpu: {
        positions: StorageBuffer;
        normals: StorageBuffer;
        indices: StorageBuffer;
    };
};

export class ChunkForgeCompute {
    private readonly availableProceduralHeightFieldComputers: Array<SphericalProceduralHeightFieldBuilder> = [];
    private readonly availableTextureHeightFieldComputers: Array<SphericalTextureHeightFieldBuilder> = [];
    private readonly availableNormalComputers: Array<SquareGridNormalComputer> = [];

    private readonly gridIndicesBufferCpu: Uint32Array;
    private readonly gridIndicesBuffer: StorageBuffer;

    private readonly proceduralHeightFieldQueue: Array<ProceduralHeightFieldTask> = [];
    private readonly textureHeightFieldQueue: Array<TextureHeightFieldTask> = [];

    private readonly normalQueue: Array<NormalTask> = [];
    private readonly applyQueue: Array<ApplyTask> = [];

    private readonly engine: WebGPUEngine;

    readonly rowVertexCount: number;

    private constructor(
        proceduralHeightFieldComputers: ReadonlyArray<SphericalProceduralHeightFieldBuilder>,
        textureHeightFieldComputers: ReadonlyArray<SphericalTextureHeightFieldBuilder>,
        normalComputers: ReadonlyArray<SquareGridNormalComputer>,
        gridIndicesBufferCpu: Uint32Array,
        gridIndicesBuffer: StorageBuffer,
        rowVertexCount: number,
        engine: WebGPUEngine,
    ) {
        this.availableProceduralHeightFieldComputers.push(...proceduralHeightFieldComputers);
        this.availableTextureHeightFieldComputers.push(...textureHeightFieldComputers);
        this.availableNormalComputers.push(...normalComputers);

        this.gridIndicesBufferCpu = gridIndicesBufferCpu;
        this.gridIndicesBuffer = gridIndicesBuffer;

        this.rowVertexCount = rowVertexCount;
        this.engine = engine;
    }

    static async New(nbComputeShaders: number, rowVertexCount: number, engine: WebGPUEngine) {
        const heightFieldComputers: Array<SphericalProceduralHeightFieldBuilder> = [];
        const textureHeightFieldComputers: Array<SphericalTextureHeightFieldBuilder> = [];
        const normalComputers: Array<SquareGridNormalComputer> = [];

        for (let i = 0; i < nbComputeShaders; i++) {
            heightFieldComputers.push(await SphericalProceduralHeightFieldBuilder.New(engine));
            textureHeightFieldComputers.push(await SphericalTextureHeightFieldBuilder.New(engine));
            normalComputers.push(await SquareGridNormalComputer.New(engine));
        }

        const gridIndicesComputer = await SquareGridIndicesComputer.New(engine);

        const gridIndicesBuffer = gridIndicesComputer.dispatch(rowVertexCount, engine);

        const gridIndexBufferView = await gridIndicesBuffer.read();

        const gridIndexBufferCpu = new Uint32Array(gridIndexBufferView.buffer);

        return new ChunkForgeCompute(
            heightFieldComputers,
            textureHeightFieldComputers,
            normalComputers,
            gridIndexBufferCpu,
            gridIndicesBuffer,
            rowVertexCount,
            engine,
        );
    }

    addBuildTask(
        onFinish: (output: ChunkForgeOutput) => void,
        positionOnCube: Vector3,
        positionOnSphere: Vector3,
        direction: Direction,
        size: number,
        sphereRadius: number,
        terrainModel: TerrainModel,
    ): void {
        const buildTask = {
            onFinish,
            positionOnCube,
            positionOnSphere,
            direction,
            size,
            sphereRadius,
        };

        switch (terrainModel.type) {
            case "procedural":
                this.proceduralHeightFieldQueue.push({ ...buildTask, terrainModel });
                break;
            case "custom":
                this.textureHeightFieldQueue.push({ ...buildTask, terrainModel });
                break;
        }
    }

    updateProcedural() {
        for (const availableComputer of this.availableProceduralHeightFieldComputers) {
            const nextTask = this.proceduralHeightFieldQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            const positions = availableComputer.dispatch(
                nextTask.positionOnCube,
                nextTask.positionOnSphere,
                this.rowVertexCount,
                nextTask.direction,
                nextTask.sphereRadius,
                nextTask.size,
                this.engine,
            );

            this.normalQueue.push({
                onFinish: nextTask.onFinish,
                positions,
            });
        }
    }

    updateCustom(textureAtlas: IPlanetHeightMapAtlas) {
        for (const availableComputer of this.availableTextureHeightFieldComputers) {
            const nextTask = this.textureHeightFieldQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            const positions = availableComputer.dispatch(
                nextTask.positionOnCube,
                nextTask.positionOnSphere,
                this.rowVertexCount,
                nextTask.direction,
                nextTask.sphereRadius,
                nextTask.size,
                {
                    maxHeight: nextTask.terrainModel.heightRange.max,
                    minHeight: nextTask.terrainModel.heightRange.min,
                    heightMap: textureAtlas.getHeightMap(nextTask.terrainModel.id),
                },
                this.engine,
            );

            this.normalQueue.push({
                onFinish: nextTask.onFinish,
                positions,
            });
        }
    }

    updateNormals() {
        for (const availableComputer of this.availableNormalComputers) {
            const nextTask = this.normalQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            const normals = availableComputer.dispatch(this.rowVertexCount, nextTask.positions, this.engine);

            this.applyQueue.push({
                onFinish: nextTask.onFinish,
                positions: nextTask.positions,
                normals,
            });
        }
    }

    applyAllReady() {
        while (this.applyQueue.length > 0) {
            const nextTask = this.applyQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            void this.runApplyTask(nextTask);
        }
    }

    update(heightMapAtlas: IPlanetHeightMapAtlas) {
        this.updateProcedural();
        this.updateCustom(heightMapAtlas);
        this.updateNormals();
        this.applyAllReady();
    }

    private async runApplyTask(task: ApplyTask) {
        const { onFinish, positions, normals } = task;

        const positionBufferView = await positions.read();
        const normalBufferView = await normals.read();

        const vertexData = new VertexData();
        vertexData.positions = new Float32Array(positionBufferView.buffer);
        vertexData.indices = this.gridIndicesBufferCpu;
        vertexData.normals = new Float32Array(normalBufferView.buffer);

        onFinish({
            cpu: vertexData,
            gpu: {
                positions,
                normals,
                indices: this.gridIndicesBuffer,
            },
        });
    }
}
