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
import { type HeightMap1x1, type HeightMap2x4 } from "@/frontend/assets/textures/heightmaps/types";

import { type Direction } from "@/utils/direction";

import { SquareGridIndicesComputer } from "../squareGridIndexComputer";
import { SquareGridNormalComputer } from "../squareGridNormalComputer";
import { SphericalHeightFieldBuilder1x1 } from "./sphericalHeightFieldBuilder1x1";
import { SphericalHeightFieldBuilder2x4 } from "./sphericalHeightFieldBuilder2x4";
import { SphericalProceduralHeightFieldBuilder } from "./sphericalProceduralHeightFieldBuilder";

type HeightFieldTask = {
    onFinish: (output: ChunkForgeOutput) => void;
    positionOnCube: Vector3;
    positionOnSphere: Vector3;
    size: number;
    direction: Direction;
    sphereRadius: number;
};

type ProceduralHeightFieldTask = HeightFieldTask & {
    terrainModel: ProceduralTerrainModel;
};

type Custom1x1HeightFieldTask = HeightFieldTask & {
    heightRange: { min: number; max: number };
    heightMap: HeightMap1x1;
};

type Custom2x4HeightFieldTask = HeightFieldTask & {
    heightRange: { min: number; max: number };
    heightMap: HeightMap2x4;
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
    private readonly availableHeightFieldProceduralComputers: Array<SphericalProceduralHeightFieldBuilder> = [];
    private readonly availableHeightField1x1Computers: Array<SphericalHeightFieldBuilder1x1> = [];
    private readonly availableHeightField2x4Computers: Array<SphericalHeightFieldBuilder2x4> = [];

    private readonly availableNormalComputers: Array<SquareGridNormalComputer> = [];

    private readonly gridIndicesBufferCpu: Uint32Array;
    private readonly gridIndicesBuffer: StorageBuffer;

    private readonly proceduralHeightFieldQueue: Array<ProceduralHeightFieldTask> = [];
    private readonly custom1x1HeightFieldQueue: Array<Custom1x1HeightFieldTask> = [];
    private readonly custom2x4HeightFieldQueue: Array<Custom2x4HeightFieldTask> = [];

    private readonly normalQueue: Array<NormalTask> = [];
    private readonly applyQueue: Array<ApplyTask> = [];

    private readonly engine: WebGPUEngine;

    private readonly heightMapAtlas: IPlanetHeightMapAtlas;

    readonly rowVertexCount: number;

    private constructor(
        computers: {
            heightFieldProcedural: ReadonlyArray<SphericalProceduralHeightFieldBuilder>;
            heightField1x1: ReadonlyArray<SphericalHeightFieldBuilder1x1>;
            heightField2x4: ReadonlyArray<SphericalHeightFieldBuilder2x4>;
            normal: ReadonlyArray<SquareGridNormalComputer>;
        },
        gridIndicesBufferCpu: Uint32Array,
        gridIndicesBuffer: StorageBuffer,
        rowVertexCount: number,
        heightMapAtlas: IPlanetHeightMapAtlas,
        engine: WebGPUEngine,
    ) {
        this.availableHeightFieldProceduralComputers.push(...computers.heightFieldProcedural);
        this.availableHeightField1x1Computers.push(...computers.heightField1x1);
        this.availableHeightField2x4Computers.push(...computers.heightField2x4);
        this.availableNormalComputers.push(...computers.normal);

        this.gridIndicesBufferCpu = gridIndicesBufferCpu;
        this.gridIndicesBuffer = gridIndicesBuffer;

        this.heightMapAtlas = heightMapAtlas;

        this.rowVertexCount = rowVertexCount;
        this.engine = engine;
    }

    static async New(
        nbComputeShaders: number,
        rowVertexCount: number,
        heightMapAtlas: IPlanetHeightMapAtlas,
        engine: WebGPUEngine,
    ) {
        const heightFieldComputers: Array<SphericalProceduralHeightFieldBuilder> = [];
        const textureHeightFieldComputers: Array<SphericalHeightFieldBuilder1x1> = [];
        const textureHeightField2x4Computers: Array<SphericalHeightFieldBuilder2x4> = [];
        const normalComputers: Array<SquareGridNormalComputer> = [];

        for (let i = 0; i < nbComputeShaders; i++) {
            heightFieldComputers.push(await SphericalProceduralHeightFieldBuilder.New(engine));
            textureHeightFieldComputers.push(await SphericalHeightFieldBuilder1x1.New(engine));
            textureHeightField2x4Computers.push(await SphericalHeightFieldBuilder2x4.New(engine));
            normalComputers.push(await SquareGridNormalComputer.New(engine));
        }

        const gridIndicesComputer = await SquareGridIndicesComputer.New(engine);

        const gridIndicesBuffer = gridIndicesComputer.dispatch(rowVertexCount, engine);

        const gridIndexBufferView = await gridIndicesBuffer.read();

        const gridIndexBufferCpu = new Uint32Array(gridIndexBufferView.buffer);

        return new ChunkForgeCompute(
            {
                heightFieldProcedural: heightFieldComputers,
                heightField1x1: textureHeightFieldComputers,
                heightField2x4: textureHeightField2x4Computers,
                normal: normalComputers,
            },
            gridIndexBufferCpu,
            gridIndicesBuffer,
            rowVertexCount,
            heightMapAtlas,
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
        } satisfies HeightFieldTask;

        switch (terrainModel.type) {
            case "procedural":
                this.proceduralHeightFieldQueue.push({ ...buildTask, terrainModel });
                break;
            case "custom":
                this.addCustomHeightFieldTask(buildTask, terrainModel);
                break;
        }
    }

    private addCustomHeightFieldTask(baseTask: HeightFieldTask, terrainModel: CustomTerrainModel): void {
        const heightMap = this.heightMapAtlas.getHeightMap(terrainModel.id);
        switch (heightMap.type) {
            case "1x1":
                this.custom1x1HeightFieldQueue.push({
                    ...baseTask,
                    heightRange: terrainModel.heightRange,
                    heightMap: heightMap,
                });
                break;
            case "2x4":
                this.custom2x4HeightFieldQueue.push({
                    ...baseTask,
                    heightRange: terrainModel.heightRange,
                    heightMap: heightMap,
                });
                break;
        }
    }

    updateProcedural() {
        for (const availableComputer of this.availableHeightFieldProceduralComputers) {
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

    updateCustom() {
        for (const availableComputer of this.availableHeightField2x4Computers) {
            const nextTask = this.custom2x4HeightFieldQueue.shift();
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
                    maxHeight: nextTask.heightRange.max,
                    minHeight: nextTask.heightRange.min,
                    heightMap: nextTask.heightMap,
                },
                this.engine,
            );

            this.normalQueue.push({
                onFinish: nextTask.onFinish,
                positions,
            });
        }

        for (const availableComputer of this.availableHeightField1x1Computers) {
            const nextTask = this.custom1x1HeightFieldQueue.shift();
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
                    maxHeight: nextTask.heightRange.max,
                    minHeight: nextTask.heightRange.min,
                    heightMap: nextTask.heightMap,
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

    update() {
        this.updateProcedural();
        this.updateCustom();
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
