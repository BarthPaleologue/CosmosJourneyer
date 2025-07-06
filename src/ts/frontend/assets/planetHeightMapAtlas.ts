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

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type Scene } from "@babylonjs/core/scene";

import { type CustomTerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import { assertUnreachable, type Result } from "@/utils/types";

import { disposeHeightMap1x1, disposeHeightMap2x4, loadHeightMap2x4FromUrlsToGpu, type HeightMap } from "./heightMaps";
import { type HeightMaps } from "./textures/heightmaps";

import earthHeightMap2x4_0_0 from "@assets/sol/textures/earthHeightMap2x4/0_0.png";
import earthHeightMap2x4_0_1 from "@assets/sol/textures/earthHeightMap2x4/0_1.png";
import earthHeightMap2x4_0_2 from "@assets/sol/textures/earthHeightMap2x4/0_2.png";
import earthHeightMap2x4_0_3 from "@assets/sol/textures/earthHeightMap2x4/0_3.png";
import earthHeightMap2x4_1_0 from "@assets/sol/textures/earthHeightMap2x4/1_0.png";
import earthHeightMap2x4_1_1 from "@assets/sol/textures/earthHeightMap2x4/1_1.png";
import earthHeightMap2x4_1_2 from "@assets/sol/textures/earthHeightMap2x4/1_2.png";
import earthHeightMap2x4_1_3 from "@assets/sol/textures/earthHeightMap2x4/1_3.png";
import marsHeightMap_0_0 from "@assets/sol/textures/marsHeightMap2x4/0_0.png";
import marsHeightMap_0_1 from "@assets/sol/textures/marsHeightMap2x4/0_1.png";
import marsHeightMap_0_2 from "@assets/sol/textures/marsHeightMap2x4/0_2.png";
import marsHeightMap_0_3 from "@assets/sol/textures/marsHeightMap2x4/0_3.png";
import marsHeightMap_1_0 from "@assets/sol/textures/marsHeightMap2x4/1_0.png";
import marsHeightMap_1_1 from "@assets/sol/textures/marsHeightMap2x4/1_1.png";
import marsHeightMap_1_2 from "@assets/sol/textures/marsHeightMap2x4/1_2.png";
import marsHeightMap_1_3 from "@assets/sol/textures/marsHeightMap2x4/1_3.png";
import mercuryHeightMap_0_0 from "@assets/sol/textures/mercuryHeightMap2x4/0_0.png";
import mercuryHeightMap_0_1 from "@assets/sol/textures/mercuryHeightMap2x4/0_1.png";
import mercuryHeightMap_0_2 from "@assets/sol/textures/mercuryHeightMap2x4/0_2.png";
import mercuryHeightMap_0_3 from "@assets/sol/textures/mercuryHeightMap2x4/0_3.png";
import mercuryHeightMap_1_0 from "@assets/sol/textures/mercuryHeightMap2x4/1_0.png";
import mercuryHeightMap_1_1 from "@assets/sol/textures/mercuryHeightMap2x4/1_1.png";
import mercuryHeightMap_1_2 from "@assets/sol/textures/mercuryHeightMap2x4/1_2.png";
import mercuryHeightMap_1_3 from "@assets/sol/textures/mercuryHeightMap2x4/1_3.png";
import moonHeightMap_0_0 from "@assets/sol/textures/moonHeightMap2x4/0_0.png";
import moonHeightMap_0_1 from "@assets/sol/textures/moonHeightMap2x4/0_1.png";
import moonHeightMap_0_2 from "@assets/sol/textures/moonHeightMap2x4/0_2.png";
import moonHeightMap_0_3 from "@assets/sol/textures/moonHeightMap2x4/0_3.png";
import moonHeightMap_1_0 from "@assets/sol/textures/moonHeightMap2x4/1_0.png";
import moonHeightMap_1_1 from "@assets/sol/textures/moonHeightMap2x4/1_1.png";
import moonHeightMap_1_2 from "@assets/sol/textures/moonHeightMap2x4/1_2.png";
import moonHeightMap_1_3 from "@assets/sol/textures/moonHeightMap2x4/1_3.png";

type HeightMapId = CustomTerrainModel["id"];

/**
 * Interface for objects that can provide height maps for planets.
 */
export interface IPlanetHeightMapAtlas {
    /**
     * Synchronously load height maps corresponding to the given keys into GPU memory.
     * @param keys An iterable of planet IDs for which to load height maps.
     */
    loadHeightMapsToGpu(keys: Iterable<HeightMapId>): Promise<Array<Result<HeightMap, Array<Error>>>>;

    /**
     * @param key The key of the height map to retrieve.
     * @returns The height map corresponding to the given key.
     */
    getHeightMap(key: HeightMapId): HeightMap;

    /**
     * Restores the initial state of the height map atlas.
     * This will release all GPU resources acquired by calling `loadHeightMapsToGpu`.
     */
    reset(): void;
}

export class PlanetHeightMapAtlas implements IPlanetHeightMapAtlas {
    private readonly heightMaps: HeightMaps;

    private higherResolutionHeightMaps: Record<string, HeightMap> = {};

    private readonly scene: Scene;

    constructor(heightMaps: HeightMaps, scene: Scene) {
        this.heightMaps = heightMaps;
        this.scene = scene;
    }

    async loadHeightMapsToGpu(keys: Iterable<HeightMapId>) {
        // load the height maps in parallel
        const promises: Array<Promise<Result<HeightMap, Array<Error>>>> = [];
        for (const key of keys) {
            const promise = this.preloadHeightMap(key);
            if (promise === undefined) {
                continue;
            }

            promises.push(promise);
        }

        return Promise.all(promises);
    }

    private preloadHeightMap(key: HeightMapId): Promise<Result<HeightMap, Array<Error>>> | undefined {
        switch (key) {
            case "mercury":
                return loadHeightMap2x4FromUrlsToGpu(
                    key,
                    [
                        [mercuryHeightMap_0_0, mercuryHeightMap_0_1, mercuryHeightMap_0_2, mercuryHeightMap_0_3],
                        [mercuryHeightMap_1_0, mercuryHeightMap_1_1, mercuryHeightMap_1_2, mercuryHeightMap_1_3],
                    ],
                    this.scene,
                ).then((result) => {
                    if (result.success) {
                        this.higherResolutionHeightMaps[key] = result.value;
                    }

                    return result;
                });
            case "venus":
                return;
            case "earth":
                return loadHeightMap2x4FromUrlsToGpu(
                    key,
                    [
                        [earthHeightMap2x4_0_0, earthHeightMap2x4_0_1, earthHeightMap2x4_0_2, earthHeightMap2x4_0_3],
                        [earthHeightMap2x4_1_0, earthHeightMap2x4_1_1, earthHeightMap2x4_1_2, earthHeightMap2x4_1_3],
                    ],
                    this.scene,
                ).then((result) => {
                    if (result.success) {
                        this.higherResolutionHeightMaps[key] = result.value;
                    }

                    return result;
                });
            case "moon":
                return loadHeightMap2x4FromUrlsToGpu(
                    key,
                    [
                        [moonHeightMap_0_0, moonHeightMap_0_1, moonHeightMap_0_2, moonHeightMap_0_3],
                        [moonHeightMap_1_0, moonHeightMap_1_1, moonHeightMap_1_2, moonHeightMap_1_3],
                    ],
                    this.scene,
                ).then((result) => {
                    if (result.success) {
                        this.higherResolutionHeightMaps[key] = result.value;
                    }

                    return result;
                });
            case "mars":
                return loadHeightMap2x4FromUrlsToGpu(
                    key,
                    [
                        [marsHeightMap_0_0, marsHeightMap_0_1, marsHeightMap_0_2, marsHeightMap_0_3],
                        [marsHeightMap_1_0, marsHeightMap_1_1, marsHeightMap_1_2, marsHeightMap_1_3],
                    ],
                    this.scene,
                ).then((result) => {
                    if (result.success) {
                        this.higherResolutionHeightMaps[key] = result.value;
                    }

                    return result;
                });
            default:
                return assertUnreachable(key);
        }
    }

    reset(): void {
        for (const heightMap of Object.values(this.higherResolutionHeightMaps)) {
            switch (heightMap.type) {
                case "2x4":
                    disposeHeightMap2x4(heightMap);
                    break;
                case "1x1":
                    disposeHeightMap1x1(heightMap);
                    break;
                default:
                    assertUnreachable(heightMap);
            }
        }

        this.higherResolutionHeightMaps = {};
    }

    getHeightMap(key: HeightMapId): HeightMap {
        const higherResolutionHeightMap = this.higherResolutionHeightMaps[key];
        if (higherResolutionHeightMap !== undefined) {
            return higherResolutionHeightMap;
        }

        switch (key) {
            case "earth":
                return this.heightMaps.earth1x1;
            case "mercury":
            case "venus":
            case "moon":
            case "mars":
                return this.heightMaps.mars1x1;
            default:
                return assertUnreachable(key);
        }
    }
}

export class PlanetHeightMapAtlasMock implements IPlanetHeightMapAtlas {
    loadHeightMapsToGpu() {
        return Promise.resolve([]);
    }

    getHeightMap(): HeightMap {
        return {
            type: "1x1",
            texture: new Texture(null, null),
        };
    }

    reset(): void {
        // No-op for mock implementation
    }
}
