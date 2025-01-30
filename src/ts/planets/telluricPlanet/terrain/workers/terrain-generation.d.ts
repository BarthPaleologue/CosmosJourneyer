declare module "terrain-generation" {
    export type TerrainWasmModule = {
        build_chunk_vertex_data: (
            buildData: any,
            verticesPositions: Float32Array,
            indices: Uint16Array,
            normals: Float32Array,
            instances_matrix_buffer: Float32Array,
            aligned_instances_matrix_buffer: Float32Array,
            scatter_per_square_meter: number
        ) => {
            nb_instances_created: number;
            average_height: number;
        };
        BuildData: new (
            planetDiameter: number,
            depth: number,
            direction: number,
            positionX: number,
            positionY: number,
            positionZ: number,
            seed: number,
            nbVerticesPerSide: number,
            terrainSettings: any
        ) => any;
        TerrainSettings: new () => any;
    };

    export function loadWasm(): Promise<TerrainWasmModule>;
}

declare module "terrain-generation/terrain_generation_bg.wasm" {
    export function init(): Promise<TerrainWasmModule>;
}
