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

import { build_chunk_vertex_data, BuildData, TerrainSettings } from "terrain-generation";

import { Settings } from "@/settings";

import { getFaceIndexFromDirection } from "../chunks/direction";
import { type ReturnedChunkData } from "../chunks/taskTypes";
import { type TransferBuildData } from "../chunks/workerDataTypes";

function handle_build(data: TransferBuildData): void {
    const nbVerticesPerSide = data.nbVerticesPerSide;
    const nbSubdivisions = nbVerticesPerSide - 1;

    const verticesPositions = new Float32Array(nbVerticesPerSide * nbVerticesPerSide * 3);
    const indices = new Uint16Array(nbSubdivisions * nbSubdivisions * 2 * 3);
    const normals = new Float32Array(verticesPositions.length);

    const size = data.planetDiameter / 2 ** data.depth;
    const space_between_vertices = size / nbSubdivisions;
    //console.log(data.depth, space_between_vertices);
    const scatter_per_square_meter = space_between_vertices < Settings.MIN_DISTANCE_BETWEEN_VERTICES ? 16 : 0;

    const flat_area = size * size;
    const max_nb_instances = Math.floor(flat_area * scatter_per_square_meter * 2.0);

    let instances_matrix_buffer = new Float32Array(16 * max_nb_instances);
    let aligned_instances_matrix_buffer = new Float32Array(16 * max_nb_instances);

    const terrain_settings = new TerrainSettings();
    terrain_settings.continent_base_height = data.terrainSettings.continent_base_height;
    terrain_settings.continents_fragmentation = data.terrainSettings.continents_fragmentation;
    terrain_settings.continents_frequency = data.terrainSettings.continents_frequency;

    terrain_settings.max_mountain_height = data.terrainSettings.max_mountain_height;
    terrain_settings.mountains_frequency = data.terrainSettings.mountains_frequency;

    terrain_settings.bumps_frequency = data.terrainSettings.bumps_frequency;
    terrain_settings.max_bump_height = data.terrainSettings.max_bump_height;

    const buildData: BuildData = new BuildData(
        data.planetDiameter,
        data.depth,
        getFaceIndexFromDirection(data.direction),
        data.position[0],
        data.position[1],
        data.position[2],
        data.seed,
        data.nbVerticesPerSide,
        terrain_settings,
    );

    const result = build_chunk_vertex_data(
        buildData,
        verticesPositions,
        indices,
        normals,
        instances_matrix_buffer,
        aligned_instances_matrix_buffer,
        scatter_per_square_meter,
    );

    instances_matrix_buffer = instances_matrix_buffer.subarray(0, result.nb_instances_created * 16);
    aligned_instances_matrix_buffer = aligned_instances_matrix_buffer.subarray(0, result.nb_instances_created * 16);

    self.postMessage(
        {
            positions: verticesPositions,
            indices: indices,
            normals: normals,
            instancesMatrixBuffer: instances_matrix_buffer,
            alignedInstancesMatrixBuffer: aligned_instances_matrix_buffer,
            averageHeight: result.average_height,
        } satisfies ReturnedChunkData,
        {
            transfer: [
                verticesPositions.buffer,
                indices.buffer,
                normals.buffer,
                instances_matrix_buffer.buffer,
                aligned_instances_matrix_buffer.buffer,
            ],
        },
    );

    buildData.free();
}

self.onmessage = (e) => {
    //const clock = Date.now();
    handle_build(e.data as TransferBuildData);
    //console.log("The chunk took: " + (Date.now() - clock));

    // benchmark fait le 5/10/2021 (normale non analytique) : ~2s/chunk
    // benchmark fait le 12/11/2021 (normale non analyique) : ~0.5s/chunk
    // benchmark fait le 20/11/2021 20h30 (normale analytique v2) : ~0.8s/chunk
    // benchmark fait le 20/11/2021 21h20 (normale analytique v2.1) : ~0.03s/chunk (30ms/chunk)
    // benchmark fait le 10/12/2021 (normale analytique v2.5) : ~ 50ms/chunk
    // benchmark fait le 19/02/2022 (normale analytique v2.6) : ~ 40ms/chunk
    // benchmark fait le 28/07/2022 (Terrain V3.1) : ~70ms/chunk
    // benchmark fait le 06/12/2022 (Terrain WASM v1) : ~140ms/chunk wtf
    // benchmark fait le 06/12/2022 (Terrain WASM v1.5) : ~60ms/chunk
};
