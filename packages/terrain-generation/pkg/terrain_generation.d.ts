/* tslint:disable */
/* eslint-disable */
/**
 *
 * * Smooth minimum between a and b
 * * @param a the first value
 * * @param b the second value
 * * @param k the smoothness factor
 * * @returns the smooth minimum between a and b
 *
 * @param {number} a
 * @param {number} b
 * @param {number} k
 * @returns {number}
 */
export function s_min(a: number, b: number, k: number): number;
/**
 *
 * * Smooth maximum between a and b
 * * @param a the first value
 * * @param b the second value
 * * @param k the smoothness factor (should be > 1)
 * * @returns the smooth maximum between a and b
 *
 * @param {number} a
 * @param {number} b
 * @param {number} k
 * @returns {number}
 */
export function s_max(a: number, b: number, k: number): number;
/**
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function gcd(a: number, b: number): number;
/**
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(x: number, min: number, max: number): number;
/**
 * Fills the given buffers with the vertex data from the chunk
 * * `data` - The data needed to guide the build process
 * * `positions` - A mutable reference to the buffer that will be filled with vertex positions
 * * `indices` - A mutable reference to the buffer that will be filled with the face indices
 * * `normals` - A mutable reference to the buffer that will be filled with the vertex normals
 * @param {BuildData} data
 * @param {Float32Array} positions
 * @param {Uint16Array} indices
 * @param {Float32Array} normals
 * @param {Float32Array} instances_matrix_buffer
 * @param {Float32Array} aligned_instances_matrix_buffer
 * @param {number} scatter_per_square_meter
 * @returns {ReturnData}
 */
export function build_chunk_vertex_data(
    data: BuildData,
    positions: Float32Array,
    indices: Uint16Array,
    normals: Float32Array,
    instances_matrix_buffer: Float32Array,
    aligned_instances_matrix_buffer: Float32Array,
    scatter_per_square_meter: number,
): ReturnData;
/**
 */
export enum Direction {
    Up = 0,
    Down = 1,
    Left = 2,
    Right = 3,
    Forward = 4,
    Backward = 5,
}
/**
 */
export class BuildData {
    free(): void;
    /**
     * @param {number} planet_diameter
     * @param {number} chunk_depth
     * @param {Direction} chunk_tree_direction
     * @param {number} chunk_cube_position_x
     * @param {number} chunk_cube_position_y
     * @param {number} chunk_cube_position_z
     * @param {number} planet_seed
     * @param {number} resolution
     * @param {TerrainSettings} terrain_settings
     */
    constructor(
        planet_diameter: number,
        chunk_depth: number,
        chunk_tree_direction: Direction,
        chunk_cube_position_x: number,
        chunk_cube_position_y: number,
        chunk_cube_position_z: number,
        planet_seed: number,
        resolution: number,
        terrain_settings: TerrainSettings,
    );
    /**
     * The x position of the chunk on the cube sphere
     */
    chunk_cube_position_x: number;
    /**
     * The y position of the chunk on the cube sphere
     */
    chunk_cube_position_y: number;
    /**
     * The z position of the chunk on the cube sphere
     */
    chunk_cube_position_z: number;
    /**
     * The depth of the chunk to generate in the quadtree (starts at 0!)
     */
    chunk_depth: number;
    /**
     * The direction of the quadtree in space
     */
    chunk_tree_direction: Direction;
    /**
     * The diameter of the planet
     */
    planet_diameter: number;
    /**
     * The seed of the planet we are generating
     */
    planet_seed: number;
    /**
     * The resolution of each chunk (x*x vertices)
     */
    resolution: number;
    /**
     * The settings guiding the terrain generation
     */
    terrain_settings: TerrainSettings;
}
/**
 */
export class ReturnData {
    free(): void;
    /**
     */
    average_height: number;
    /**
     */
    nb_instances_created: number;
}
/**
 */
export class TerrainSettings {
    free(): void;
    /**
     */
    constructor();
    /**
     */
    bumps_frequency: number;
    /**
     */
    continent_base_height: number;
    /**
     */
    continents_fragmentation: number;
    /**
     */
    continents_frequency: number;
    /**
     */
    max_bump_height: number;
    /**
     */
    max_mountain_height: number;
    /**
     */
    mountains_frequency: number;
}
