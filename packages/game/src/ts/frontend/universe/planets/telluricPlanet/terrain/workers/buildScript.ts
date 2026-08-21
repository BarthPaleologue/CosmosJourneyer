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
import type { ReturnedChunkData } from "../chunks/taskTypes";
import type { TransferBuildData } from "../chunks/workerDataTypes";

function handleBuild(data: TransferBuildData): void {
    const buffers = createChunkBuffers(data);
    const transfer: Array<Transferable> = [buffers.positions.buffer, buffers.indices.buffer, buffers.normals.buffer];

    for (const instanceBuffers of Object.values(buffers.scatteredInstances)) {
        transfer.push(
            instanceBuffers.matrices.buffer,
            instanceBuffers.positions.buffer,
            instanceBuffers.rotations.buffer,
            instanceBuffers.scales.buffer,
        );
    }

    self.postMessage({ chunkId: data.chunkId, ...buffers } satisfies ReturnedChunkData, { transfer });
}

self.onmessage = ({ data }: MessageEvent<TransferBuildData>): void => {
    handleBuild(data);
};

self.postMessage("ready");
