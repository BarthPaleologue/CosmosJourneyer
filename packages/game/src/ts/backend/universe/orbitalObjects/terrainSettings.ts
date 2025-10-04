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

// Interface ayant vocation à remplacer toutes les interfaces de paramétrisation du terrain

export interface TerrainSettings {
    continents_frequency: number;
    continents_fragmentation: number; // entre 0 et 1 : 0=pangée 1=ilots
    continent_base_height: number; // élévation du plateau continental

    max_mountain_height: number;
    mountains_frequency: number;

    max_bump_height: number;
    bumps_frequency: number;
}
