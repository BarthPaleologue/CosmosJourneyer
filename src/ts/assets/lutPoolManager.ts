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

import { Scene } from "@babylonjs/core/scene";
import { RingsLut } from "../rings/ringsLut";
import { TelluricPlanetMaterialLut } from "../planets/telluricPlanet/telluricPlanetMaterialLut";

export class LutPoolManager {
    private static RINGS_LUT_POOL: RingsLut[] = [];

    static GetRingsLut(scene: Scene): RingsLut {
        return this.RINGS_LUT_POOL.pop() ?? new RingsLut(scene);
    }

    static ReturnRingsLut(lut: RingsLut): void {
        this.RINGS_LUT_POOL.push(lut);
    }

    private static TELLURIC_PLANET_MATERIAL_LUT_POOL: TelluricPlanetMaterialLut[] = [];

    static GetTelluricPlanetMaterialLut(scene: Scene): TelluricPlanetMaterialLut {
        return this.TELLURIC_PLANET_MATERIAL_LUT_POOL.pop() ?? new TelluricPlanetMaterialLut(scene);
    }

    static ReturnTelluricPlanetMaterialLut(lut: TelluricPlanetMaterialLut): void {
        this.TELLURIC_PLANET_MATERIAL_LUT_POOL.push(lut);
    }
}
