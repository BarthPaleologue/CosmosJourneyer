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

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import HavokPhysics from "@babylonjs/havok";
import type { HavokPhysicsWithBindings } from "@babylonjs/havok";

let havokPromise: Promise<HavokPhysicsWithBindings> | null = null;

/**
 * Loads the Havok WASM module from the installed package.
 * The bindings are shared by every physics test in the same worker.
 * @returns Havok bindings ready to create a physics plugin.
 */
export async function createHavokForTests(): Promise<HavokPhysicsWithBindings> {
    havokPromise ??= (async () => {
        const wasmPath = createRequire(import.meta.url).resolve("@babylonjs/havok/lib/esm/HavokPhysics.wasm");
        const wasmBinary = new Uint8Array(await readFile(wasmPath)).buffer;
        return await HavokPhysics({ wasmBinary });
    })();

    return await havokPromise;
}
