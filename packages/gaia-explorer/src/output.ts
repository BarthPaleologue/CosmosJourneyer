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
    cubes: Readonly<Record<CubeId, SpatialCube>>;
}>;
export function buildOutput(
    cubes: ReadonlyMap<CubeId, SpatialCube>,
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
