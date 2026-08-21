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

import { compute_heights } from "terrain-generation";

import { createTerrainSettings } from "./createTerrainSettings";
import type { ComputeHeightsWorkerPayload } from "./workers/terrainSystemWorkerProtocol";

export function computeHeights(task: ComputeHeightsWorkerPayload): Float32Array<ArrayBuffer> {
    const pointCount = Math.floor(task.coordinates.length / 2);
    const heights = new Float32Array(pointCount);

    const terrainSettings = createTerrainSettings(task.planetModel);

    compute_heights(terrainSettings, task.coordinates, heights);

    terrainSettings.free();

    return heights;
}
