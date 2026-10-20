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

import { createChunkBuffers } from "../chunks/createChunkBuffers";
import { computeHeights } from "../computeHeights";
import type { TaskId } from "../system/terrainSystem";
import type {
    BuildChunkWorkerPayload,
    ComputeHeightsWorkerPayload,
    TerrainSystemWorkerOutput,
    TerrainSystemWorkerTask,
} from "./terrainSystemWorkerProtocol";

type ReturnPayload = {
    output: TerrainSystemWorkerOutput;
    transfer: Array<Transferable>;
};

self.onmessage = ({ data }: MessageEvent<TerrainSystemWorkerTask>): void => {
    const { output, transfer } = handleTask(data);
    self.postMessage(output satisfies TerrainSystemWorkerOutput, { transfer });
};

/**
 * Routes a worker message to the chunk-building or height-computation handler.
 * @param task - The terrain task containing the inputs for this computation.
 * @returns The worker response produced by the selected task handler.
 */
function handleTask(task: TerrainSystemWorkerTask): ReturnPayload {
    switch (task.payload.type) {
        case "buildChunk":
            return handleBuildChunkTask(task.taskId, task.payload);
        case "computeHeights":
            return handleComputeHeightsTask(task.taskId, task.payload);
    }
}

/**
 * Builds terrain mesh buffers and packages them with the originating task identifier.
 * @param taskId - Identifier assigned to the terrain task.
 * @param task - The terrain task containing the inputs for this computation.
 * @returns The chunk buffers and transferable buffers for the worker response.
 */
function handleBuildChunkTask(taskId: TaskId, task: BuildChunkWorkerPayload): ReturnPayload {
    const { positions, indices, normals, scatteredInstances } = createChunkBuffers(task);

    const transfer: Array<Transferable> = [positions.buffer, indices.buffer, normals.buffer];
    for (const buffers of Object.values(scatteredInstances)) {
        transfer.push(
            buffers.matrices.buffer,
            buffers.positions.buffer,
            buffers.rotations.buffer,
            buffers.scales.buffer,
        );
    }

    return {
        output: {
            type: "createChunkOutput",
            taskId,
            positions,
            indices,
            normals,
            scatteredInstances,
        },
        transfer,
    };
}

/**
 * Computes terrain height samples and packages them with the originating task identifier.
 * @param taskId - Identifier assigned to the terrain task.
 * @param task - The terrain task containing the inputs for this computation.
 * @returns The height samples and their transferable buffer for the worker response.
 */
function handleComputeHeightsTask(taskId: TaskId, task: ComputeHeightsWorkerPayload): ReturnPayload {
    const heights = computeHeights(task);

    return {
        output: {
            type: "computeHeightsOutput",
            taskId,
            heights,
        },
        transfer: [heights.buffer],
    };
}

self.postMessage("ready");
