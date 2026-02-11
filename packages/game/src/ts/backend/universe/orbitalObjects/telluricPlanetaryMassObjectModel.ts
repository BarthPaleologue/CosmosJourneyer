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

import { type CloudsModel } from "@/backend/universe/orbitalObjects/cloudsModel";
import { type TerrainSettings } from "@/backend/universe/orbitalObjects/terrainSettings";

import { type AtmosphereModel } from "./atmosphereModel";
import { type OrbitalObjectType } from "./index";
import { type OceanModel } from "./oceanModel";
import { type CelestialBodyModelBase } from "./orbitalObjectModelBase";

export type TelluricPlanetaryMassObjectModelBase<T extends OrbitalObjectType> = CelestialBodyModelBase<T> & {
    waterAmount: number;
    terrainSettings: TerrainSettings;

    /**
     * The temperature range of the object in Kelvin
     * TODO: remove when the temperature gets calculated dynamically
     * @deprecated
     */
    temperature: {
        /**
         * Minimum temperature of the object in Kelvin
         */
        min: number;
        /**
         * Maximum temperature of the object in Kelvin
         */
        max: number;
    };

    atmosphere: AtmosphereModel | null;
    clouds: CloudsModel | null;
    ocean: OceanModel | null;
};
