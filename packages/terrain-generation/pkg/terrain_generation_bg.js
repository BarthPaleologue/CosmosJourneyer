let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint16ArrayMemory0 = null;
function getUint16ArrayMemory0() {
    if (cachedUint16ArrayMemory0 === null || cachedUint16ArrayMemory0.byteLength === 0) {
        cachedUint16ArrayMemory0 = new Uint16Array(wasm.memory.buffer);
    }
    return cachedUint16ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArray16ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 2, 2) >>> 0;
    getUint16ArrayMemory0().set(arg, ptr / 2);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

const BuildDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_builddata_free(ptr >>> 0, 1));

const ReturnDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_returndata_free(ptr >>> 0, 1));

const TerrainSettingsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_terrainsettings_free(ptr >>> 0, 1));

export class BuildData {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BuildDataFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_builddata_free(ptr, 0);
    }
    /**
     * The diameter of the planet
     * @returns {number}
     */
    get planet_diameter() {
        const ret = wasm.__wbg_get_builddata_planet_diameter(this.__wbg_ptr);
        return ret;
    }
    /**
     * The diameter of the planet
     * @param {number} arg0
     */
    set planet_diameter(arg0) {
        wasm.__wbg_set_builddata_planet_diameter(this.__wbg_ptr, arg0);
    }
    /**
     * The depth of the chunk to generate in the quadtree (starts at 0!)
     * @returns {number}
     */
    get chunk_depth() {
        const ret = wasm.__wbg_get_builddata_chunk_depth(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The depth of the chunk to generate in the quadtree (starts at 0!)
     * @param {number} arg0
     */
    set chunk_depth(arg0) {
        wasm.__wbg_set_builddata_chunk_depth(this.__wbg_ptr, arg0);
    }
    /**
     * The direction of the quadtree in space
     * @returns {Direction}
     */
    get chunk_tree_direction() {
        const ret = wasm.__wbg_get_builddata_chunk_tree_direction(this.__wbg_ptr);
        return ret;
    }
    /**
     * The direction of the quadtree in space
     * @param {Direction} arg0
     */
    set chunk_tree_direction(arg0) {
        wasm.__wbg_set_builddata_chunk_tree_direction(this.__wbg_ptr, arg0);
    }
    /**
     * The x position of the chunk on the cube sphere
     * @returns {number}
     */
    get chunk_cube_position_x() {
        const ret = wasm.__wbg_get_builddata_chunk_cube_position_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * The x position of the chunk on the cube sphere
     * @param {number} arg0
     */
    set chunk_cube_position_x(arg0) {
        wasm.__wbg_set_builddata_chunk_cube_position_x(this.__wbg_ptr, arg0);
    }
    /**
     * The y position of the chunk on the cube sphere
     * @returns {number}
     */
    get chunk_cube_position_y() {
        const ret = wasm.__wbg_get_builddata_chunk_cube_position_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * The y position of the chunk on the cube sphere
     * @param {number} arg0
     */
    set chunk_cube_position_y(arg0) {
        wasm.__wbg_set_builddata_chunk_cube_position_y(this.__wbg_ptr, arg0);
    }
    /**
     * The z position of the chunk on the cube sphere
     * @returns {number}
     */
    get chunk_cube_position_z() {
        const ret = wasm.__wbg_get_builddata_chunk_cube_position_z(this.__wbg_ptr);
        return ret;
    }
    /**
     * The z position of the chunk on the cube sphere
     * @param {number} arg0
     */
    set chunk_cube_position_z(arg0) {
        wasm.__wbg_set_builddata_chunk_cube_position_z(this.__wbg_ptr, arg0);
    }
    /**
     * The seed of the planet we are generating
     * @returns {number}
     */
    get planet_seed() {
        const ret = wasm.__wbg_get_builddata_planet_seed(this.__wbg_ptr);
        return ret;
    }
    /**
     * The seed of the planet we are generating
     * @param {number} arg0
     */
    set planet_seed(arg0) {
        wasm.__wbg_set_builddata_planet_seed(this.__wbg_ptr, arg0);
    }
    /**
     * The resolution of each chunk (x*x vertices)
     * @returns {number}
     */
    get resolution() {
        const ret = wasm.__wbg_get_builddata_resolution(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The resolution of each chunk (x*x vertices)
     * @param {number} arg0
     */
    set resolution(arg0) {
        wasm.__wbg_set_builddata_resolution(this.__wbg_ptr, arg0);
    }
    /**
     * The settings guiding the terrain generation
     * @returns {TerrainSettings}
     */
    get terrain_settings() {
        const ret = wasm.__wbg_get_builddata_terrain_settings(this.__wbg_ptr);
        return TerrainSettings.__wrap(ret);
    }
    /**
     * The settings guiding the terrain generation
     * @param {TerrainSettings} arg0
     */
    set terrain_settings(arg0) {
        _assertClass(arg0, TerrainSettings);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_builddata_terrain_settings(this.__wbg_ptr, ptr0);
    }
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
    constructor(planet_diameter, chunk_depth, chunk_tree_direction, chunk_cube_position_x, chunk_cube_position_y, chunk_cube_position_z, planet_seed, resolution, terrain_settings) {
        _assertClass(terrain_settings, TerrainSettings);
        var ptr0 = terrain_settings.__destroy_into_raw();
        const ret = wasm.builddata_new(planet_diameter, chunk_depth, chunk_tree_direction, chunk_cube_position_x, chunk_cube_position_y, chunk_cube_position_z, planet_seed, resolution, ptr0);
        this.__wbg_ptr = ret >>> 0;
        BuildDataFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) BuildData.prototype[Symbol.dispose] = BuildData.prototype.free;

/**
 * @enum {0 | 1 | 2 | 3 | 4 | 5}
 */
export const Direction = Object.freeze({
    Up: 0, "0": "Up",
    Down: 1, "1": "Down",
    Left: 2, "2": "Left",
    Right: 3, "3": "Right",
    Forward: 4, "4": "Forward",
    Backward: 5, "5": "Backward",
});

export class ReturnData {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ReturnData.prototype);
        obj.__wbg_ptr = ptr;
        ReturnDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ReturnDataFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_returndata_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get nb_instances_created() {
        const ret = wasm.__wbg_get_returndata_nb_instances_created(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set nb_instances_created(arg0) {
        wasm.__wbg_set_returndata_nb_instances_created(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get average_height() {
        const ret = wasm.__wbg_get_returndata_average_height(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set average_height(arg0) {
        wasm.__wbg_set_returndata_average_height(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) ReturnData.prototype[Symbol.dispose] = ReturnData.prototype.free;

export class TerrainSettings {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TerrainSettings.prototype);
        obj.__wbg_ptr = ptr;
        TerrainSettingsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TerrainSettingsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_terrainsettings_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.terrainsettings_new();
        this.__wbg_ptr = ret >>> 0;
        TerrainSettingsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    get continents_frequency() {
        const ret = wasm.__wbg_get_terrainsettings_continents_frequency(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set continents_frequency(arg0) {
        wasm.__wbg_set_terrainsettings_continents_frequency(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get bumps_frequency() {
        const ret = wasm.__wbg_get_terrainsettings_bumps_frequency(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set bumps_frequency(arg0) {
        wasm.__wbg_set_terrainsettings_bumps_frequency(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get mountains_frequency() {
        const ret = wasm.__wbg_get_terrainsettings_mountains_frequency(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set mountains_frequency(arg0) {
        wasm.__wbg_set_terrainsettings_mountains_frequency(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get continents_fragmentation() {
        const ret = wasm.__wbg_get_terrainsettings_continents_fragmentation(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set continents_fragmentation(arg0) {
        wasm.__wbg_set_terrainsettings_continents_fragmentation(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get continent_base_height() {
        const ret = wasm.__wbg_get_terrainsettings_continent_base_height(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set continent_base_height(arg0) {
        wasm.__wbg_set_terrainsettings_continent_base_height(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get max_mountain_height() {
        const ret = wasm.__wbg_get_terrainsettings_max_mountain_height(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set max_mountain_height(arg0) {
        wasm.__wbg_set_terrainsettings_max_mountain_height(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get max_bump_height() {
        const ret = wasm.__wbg_get_terrainsettings_max_bump_height(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set max_bump_height(arg0) {
        wasm.__wbg_set_terrainsettings_max_bump_height(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) TerrainSettings.prototype[Symbol.dispose] = TerrainSettings.prototype.free;

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
export function build_chunk_vertex_data(data, positions, indices, normals, instances_matrix_buffer, aligned_instances_matrix_buffer, scatter_per_square_meter) {
    _assertClass(data, BuildData);
    var ptr0 = passArrayF32ToWasm0(positions, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    var ptr1 = passArray16ToWasm0(indices, wasm.__wbindgen_malloc);
    var len1 = WASM_VECTOR_LEN;
    var ptr2 = passArrayF32ToWasm0(normals, wasm.__wbindgen_malloc);
    var len2 = WASM_VECTOR_LEN;
    var ptr3 = passArrayF32ToWasm0(instances_matrix_buffer, wasm.__wbindgen_malloc);
    var len3 = WASM_VECTOR_LEN;
    var ptr4 = passArrayF32ToWasm0(aligned_instances_matrix_buffer, wasm.__wbindgen_malloc);
    var len4 = WASM_VECTOR_LEN;
    const ret = wasm.build_chunk_vertex_data(data.__wbg_ptr, ptr0, len0, positions, ptr1, len1, indices, ptr2, len2, normals, ptr3, len3, instances_matrix_buffer, ptr4, len4, aligned_instances_matrix_buffer, scatter_per_square_meter);
    return ReturnData.__wrap(ret);
}

/**
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(x, min, max) {
    const ret = wasm.clamp(x, min, max);
    return ret;
}

/**
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function gcd(a, b) {
    const ret = wasm.gcd(a, b);
    return ret;
}

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
export function s_max(a, b, k) {
    const ret = wasm.s_max(a, b, k);
    return ret;
}

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
export function s_min(a, b, k) {
    const ret = wasm.s_min(a, b, k);
    return ret;
}

export function __wbg___wbindgen_copy_to_typed_array_db832bc4df7216c1(arg0, arg1, arg2) {
    new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(getArrayU8FromWasm0(arg0, arg1));
};

export function __wbg___wbindgen_throw_dd24417ed36fc46e(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_externrefs;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
};
