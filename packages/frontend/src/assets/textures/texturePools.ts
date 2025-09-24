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

import { type Scene } from "@babylonjs/core/scene";

import { CloudsLut } from "@/frontend/postProcesses/clouds/cloudsLut";
import { RingsProceduralPatternLut } from "@/frontend/postProcesses/rings/ringsProceduralLut";
import { TelluricPlanetMaterialLut } from "@/frontend/universe/planets/telluricPlanet/telluricPlanetMaterialLut";
import { StarMaterialLut } from "@/frontend/universe/stellarObjects/star/starMaterialLut";

import { ItemPool } from "@/utils/itemPool";

import { LandingPadTexturePool } from "../landingPadTexturePool";

export type TexturePools = {
    cloudsLut: ItemPool<CloudsLut>;
    ringsPatternLut: ItemPool<RingsProceduralPatternLut>;
    starMaterialLut: ItemPool<StarMaterialLut>;
    telluricPlanetMaterialLut: ItemPool<TelluricPlanetMaterialLut>;
    landingPad: LandingPadTexturePool;
};

export function createTexturePools(scene: Scene): TexturePools {
    return {
        cloudsLut: new ItemPool<CloudsLut>(() => new CloudsLut(scene)),
        ringsPatternLut: new ItemPool<RingsProceduralPatternLut>(() => new RingsProceduralPatternLut(scene)),
        starMaterialLut: new ItemPool<StarMaterialLut>(() => new StarMaterialLut(scene)),
        telluricPlanetMaterialLut: new ItemPool<TelluricPlanetMaterialLut>(() => new TelluricPlanetMaterialLut(scene)),
        landingPad: new LandingPadTexturePool(),
    };
}
