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
import type { TaskId } from "../chunks/terrainSystem";
import {
    type BuildChunkWorkerPayload,
    type TerrainSystemWorkerTask,
    type TerrainSystemWorkerOutput,
} from "./terrainSystemWorkerProtocol";

type ReturnPayload = {
    output: TerrainSystemWorkerOutput;
    transfer: Array<Transferable>;
};

self.onmessage = ({ data }: MessageEvent<TerrainSystemWorkerTask>): void => {
    const { output, transfer } = handleBuildChunkTask(data.taskId, data.payload);
    self.postMessage(output satisfies TerrainSystemWorkerOutput, { transfer });
};

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

self.postMessage("ready");
