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

import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { build_chunk_vertex_data, BuildData, TerrainSettings } from "terrain-generation";

import { smoothstep } from "@/utils/math";

import { Settings } from "@/settings";

import { filterPoints, MaxScatterDensity, type ScatteringLayer } from "../../../../../helpers/instancing";
import { BeachElevationSpan } from "../../telluricPlanetMaterial";
import type { ScatteredInstances } from "../chunks/scatteringSystem";
import { type ReturnedChunkData } from "../chunks/taskTypes";
import { type TransferBuildData } from "../chunks/workerDataTypes";

const SKIRT_GENERATION_VERTEX_SPACING_THRESHOLD = 512;

function handle_build(data: TransferBuildData): void {
    const nbVerticesPerSide = data.nbVerticesPerSide;
    const nbSubdivisions = nbVerticesPerSide - 1;

    const planetModel = data.planetModel;
    const planetDiameter = planetModel.radius * 2;

    const size = planetDiameter / 2 ** data.depth;
    const space_between_vertices = size / nbSubdivisions;
    const scatter_per_square_meter =
        space_between_vertices < Settings.MIN_DISTANCE_BETWEEN_VERTICES ? MaxScatterDensity : 0;

    const shouldGenerateSkirt = space_between_vertices < SKIRT_GENERATION_VERTEX_SPACING_THRESHOLD;
    const skirtVertexCount = shouldGenerateSkirt ? 4 * nbVerticesPerSide : 0;
    const skirtIndexCount = shouldGenerateSkirt ? 4 * nbSubdivisions * 2 * 3 : 0;

    const verticesPositions = new Float32Array((nbVerticesPerSide * nbVerticesPerSide + skirtVertexCount) * 3);
    const indices = new Uint16Array(nbSubdivisions * nbSubdivisions * 2 * 3 + skirtIndexCount);
    const normals = new Float32Array(verticesPositions.length);

    const flat_area = size * size;
    const max_nb_instances = Math.floor(flat_area * scatter_per_square_meter * 2.0);

    let scattered_point_buffer = new Float32Array(6 * max_nb_instances);

    const terrain_settings = new TerrainSettings();
    terrain_settings.continent_base_height = planetModel.terrainSettings.continent_base_height;
    terrain_settings.continents_fragmentation = planetModel.terrainSettings.continents_fragmentation;
    terrain_settings.continents_frequency = planetModel.terrainSettings.continents_frequency;

    terrain_settings.max_mountain_height = planetModel.terrainSettings.max_mountain_height;
    terrain_settings.mountains_frequency = planetModel.terrainSettings.mountains_frequency;

    terrain_settings.bumps_frequency = planetModel.terrainSettings.bumps_frequency;
    terrain_settings.max_bump_height = planetModel.terrainSettings.max_bump_height;

    const buildData: BuildData = new BuildData(
        planetDiameter,
        data.depth,
        data.faceIndex,
        data.position[0],
        data.position[1],
        data.position[2],
        planetModel.seed,
        data.nbVerticesPerSide,
        terrain_settings,
    );

    const result = build_chunk_vertex_data(
        buildData,
        verticesPositions,
        indices,
        normals,
        scattered_point_buffer,
        scatter_per_square_meter,
    );

    const transfer: Array<Transferable> = [verticesPositions.buffer, indices.buffer, normals.buffer];

    scattered_point_buffer = scattered_point_buffer.subarray(0, result.nb_instances_created * 6);

    const scatteredInstances: ScatteredInstances = {};
    if (scattered_point_buffer.length !== 0) {
        const rockLayer: ScatteringLayer = () => ({
            density: 1 / 15 ** 2,
            scalingOverride: Vector3.One().scaleInPlace(0.2 + Math.random() * 4),
            rotationOverride: Quaternion.FromEulerAngles(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI,
            ),
        });

        if (planetModel.atmosphere !== null && planetModel.ocean !== null) {
            const gravityUp = new Vector3(data.position[0], data.position[1], data.position[2]).normalize();
            const chunkPosition = gravityUp.scale(planetModel.radius);
            const grassLayer: ScatteringLayer = (position, normal) => {
                const flatness = normal.dot(gravityUp);
                const flatnessMask = smoothstep(0.9, 0.95, flatness);

                const positionPlanetSpace = position.add(chunkPosition);
                const heightAboveSeaLevel =
                    positionPlanetSpace.length() - (planetModel.radius + (planetModel.ocean?.depth ?? 0));
                const heightMask = smoothstep(
                    (0.7 * BeachElevationSpan) / 2,
                    (0.85 * BeachElevationSpan) / 2,
                    heightAboveSeaLevel,
                );

                return {
                    density: MaxScatterDensity * flatnessMask * heightMask,
                    rotationOverride: Quaternion.FromUnitVectorsToRef(
                        Vector3.UpReadOnly,
                        normal,
                        Quaternion.Identity(),
                    ).multiply(Quaternion.RotationAxis(Axis.Y, Math.random() * 2 * Math.PI)),
                };
            };

            const treeLayer: ScatteringLayer = (position, normal) => {
                const flatness = normal.dot(gravityUp);
                const flatnessMask = smoothstep(0.9, 0.95, flatness);

                const positionPlanetSpace = position.add(chunkPosition);
                const heightAboveSeaLevel =
                    positionPlanetSpace.length() - (planetModel.radius + (planetModel.ocean?.depth ?? 0));
                const heightMask = smoothstep(
                    (0.9 * BeachElevationSpan) / 2,
                    (0.95 * BeachElevationSpan) / 2,
                    heightAboveSeaLevel,
                );

                return {
                    density: (1 / 17 ** 2) * flatnessMask * heightMask,
                    rotationOverride: Quaternion.FromUnitVectorsToRef(
                        Vector3.UpReadOnly,
                        gravityUp,
                        Quaternion.Identity(),
                    ).multiply(Quaternion.RotationAxis(Axis.Y, Math.random() * 2 * Math.PI)),
                    scalingOverride: Vector3.One().scaleInPlace(0.5 + Math.random() * 2),
                };
            };

            const butterflyLayer: ScatteringLayer = (position, normal) => {
                const flatness = normal.dot(gravityUp);
                const flatnessMask = smoothstep(0.9, 0.95, flatness);

                const positionPlanetSpace = position.add(chunkPosition);
                const heightAboveSeaLevel =
                    positionPlanetSpace.length() - (planetModel.radius + (planetModel.ocean?.depth ?? 0));
                const heightMask = smoothstep(
                    (1.05 * BeachElevationSpan) / 2,
                    (1.1 * BeachElevationSpan) / 2,
                    heightAboveSeaLevel,
                );

                return {
                    density: (1 / 7 ** 2) * flatnessMask * heightMask,
                    rotationOverride: Quaternion.FromUnitVectorsToRef(
                        Vector3.UpReadOnly,
                        gravityUp,
                        Quaternion.Identity(),
                    ),
                };
            };

            const [rockBuffer, grassBuffer, treeBuffer, butterflyBuffer] = filterPoints(scattered_point_buffer, [
                rockLayer,
                grassLayer,
                treeLayer,
                butterflyLayer,
            ]);
            scatteredInstances.rock = rockBuffer;
            scatteredInstances.grass = grassBuffer;
            scatteredInstances.tree = treeBuffer;
            scatteredInstances.butterfly = butterflyBuffer;
            transfer.push(rockBuffer.buffer, grassBuffer.buffer, treeBuffer.buffer, butterflyBuffer.buffer);
        } else {
            const [rockBuffer] = filterPoints(scattered_point_buffer, [rockLayer]);
            scatteredInstances.rock = rockBuffer;
            transfer.push(rockBuffer.buffer);
        }
    }

    self.postMessage(
        {
            chunkId: data.chunkId,
            positions: verticesPositions,
            indices: indices,
            normals: normals,
            scatteredInstances,
        } satisfies ReturnedChunkData,
        { transfer },
    );

    buildData.free();
}

self.onmessage = (e: MessageEvent<TransferBuildData>) => {
    handle_build(e.data);
};

self.postMessage("ready");
