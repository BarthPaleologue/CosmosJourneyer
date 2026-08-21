/* @ts-self-types="./terrain_generation.d.ts" */
import * as wasm from "./terrain_generation_bg.wasm";
import { __wbg_set_wasm } from "./terrain_generation_bg.js";

__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    BuildData, Direction, ReturnData, TerrainSettings, build_chunk_vertex_data, clamp, compute_heights, gcd, s_max, s_min
} from "./terrain_generation_bg.js";
