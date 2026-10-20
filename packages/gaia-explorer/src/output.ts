import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";

import type { DeepReadonly } from "@cosmos-journeyer/typescript";

import type { GridConfig, QueryConfig } from "./config";
import { computeParallaxMinMas } from "./config";
import type { CubeId, SpatialCube } from "./spatial";
export type OutputPayload = DeepReadonly<{
    metadata: {
        cube_edge_ly: number;
        range_half_extent_ly: number;
        query_radius_ly: number;
        retrieved_rows: number;
        retained_stars: number;
        cubes_nonempty: number;
        generated_utc: string;
    };
    selection: {
        parallax_min_mas: number;
        parallax_over_error_min: number;
        ruwe_max: number;
        temperature_min_K?: number;
        row_limit?: number;
    };
    cubes: Record<CubeId, SpatialCube>;
}>;
/**
 * Builds the output payload with selection settings and retrieval statistics.
 * @param cubes Populated spatial cubes to serialize.
 * @param grid Spatial grid dimensions used for the query.
 * @param query Gaia query filters used to select rows.
 * @param retrieved Number of rows returned by Gaia.
 * @param retained Number of stars retained after processing.
 * @param now Clock used to stamp the payload generation time.
 * @returns The complete dataset payload.
 */
export function buildOutput(
    cubes: DeepReadonly<Map<CubeId, SpatialCube>>,
    grid: GridConfig,
    query: QueryConfig,
    retrieved: number,
    retained: number,
    now: () => Date = () => new Date(),
): OutputPayload {
    const selection: OutputPayload["selection"] = {
        parallax_min_mas: computeParallaxMinMas(query),
        parallax_over_error_min: query.parallaxOverErrorMin,
        ruwe_max: query.ruweMax,
        ...(query.temperatureMin === undefined ? {} : { temperature_min_K: query.temperatureMin }),
        ...(query.limit === undefined ? {} : { row_limit: query.limit }),
    };
    return {
        metadata: {
            cube_edge_ly: grid.gridSize,
            range_half_extent_ly: grid.halfExtent,
            query_radius_ly: query.radiusLy,
            retrieved_rows: retrieved,
            retained_stars: retained,
            cubes_nonempty: cubes.size,
            generated_utc: now().toISOString(),
        },
        selection,
        cubes: Object.fromEntries(cubes),
    };
}
/**
 * Writes the dataset as JSON and gzip-compressed JSON.
 * @param payload Dataset payload to write.
 * @param jsonPath Destination path for the JSON file.
 * @param gzipPath Destination path for the gzip file.
 */
export async function dumpOutputs(payload: OutputPayload, jsonPath: string, gzipPath: string): Promise<void> {
    const text = JSON.stringify(payload);
    await Promise.all([
        mkdir(dirname(resolve(jsonPath)), { recursive: true }),
        mkdir(dirname(resolve(gzipPath)), { recursive: true }),
    ]);
    await Promise.all([
        writeFile(jsonPath, text, "utf8"),
        promisify(gzip)(Buffer.from(text)).then(async (data) => writeFile(gzipPath, data)),
    ]);
}
