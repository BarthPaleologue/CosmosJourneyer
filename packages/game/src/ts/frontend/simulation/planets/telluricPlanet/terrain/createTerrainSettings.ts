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

import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { TelluricPlanetModel, TelluricSatelliteModel } from "@cosmos-journeyer/universe-model";
import { TerrainSettings } from "terrain-generation";

export function createTerrainSettings(
    planetModel: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>,
): TerrainSettings {
    const terrainSettings = new TerrainSettings();
    terrainSettings.planet_diameter = planetModel.radius * 2;
    terrainSettings.seed = planetModel.seed;

    terrainSettings.continent_base_height = planetModel.terrainSettings.continent_base_height;
    terrainSettings.continents_fragmentation = planetModel.terrainSettings.continents_fragmentation;
    terrainSettings.continents_frequency = planetModel.terrainSettings.continents_frequency;

    terrainSettings.max_mountain_height = planetModel.terrainSettings.max_mountain_height;
    terrainSettings.mountains_frequency = planetModel.terrainSettings.mountains_frequency;

    terrainSettings.bumps_frequency = planetModel.terrainSettings.bumps_frequency;
    terrainSettings.max_bump_height = planetModel.terrainSettings.max_bump_height;

    return terrainSettings;
}
