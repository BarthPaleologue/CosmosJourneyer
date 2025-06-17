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

import { type CustomTerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import type { HeightMap, HeightMaps } from "./textures/heightmaps/types";

export interface IPlanetHeightMapAtlas {
    getHeightMap(key: CustomTerrainModel["id"]): HeightMap;
}

export class PlanetHeightMapAtlas implements IPlanetHeightMapAtlas {
    private readonly heightMaps: HeightMaps;
    constructor(heightMaps: HeightMaps) {
        this.heightMaps = heightMaps;
    }

    getHeightMap(key: CustomTerrainModel["id"]): HeightMap {
        switch (key) {
            case "mercury":
            case "venus":
            case "earth":
            case "moon":
            case "mars":
                return this.heightMaps.mars2x4;
        }
    }
}

export class PlanetHeightMapAtlasMock implements IPlanetHeightMapAtlas {
    getHeightMap(): HeightMap {
        return {
            type: "1x1",
            texture: new Texture(null, null),
        };
    }
}
