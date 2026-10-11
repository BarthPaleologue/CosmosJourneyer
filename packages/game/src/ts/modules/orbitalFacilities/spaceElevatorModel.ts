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

import type { SystemContentModel } from "@/backend/systemEntity/systemEntityModel";

import type { CropType } from "@/utils/agriculture";

import type { ElevatorSectionModel } from "./sections";
import type { Faction } from "./society/factions";

export type SpaceElevatorModel = SystemContentModel<"spaceElevator"> & {
    population: number;

    /**
     * The average yearly energy consumption of a citizen of the habitat in kWh.
     */
    annualEnergyPerCapitaKWh: number;

    /**
     * The number of inhabitants per square kilometer in the habitat
     */
    populationDensity: number;

    agricultureMix: [number, CropType][];

    nbHydroponicLayers: number;

    faction: Faction;

    solarPanelEfficiency: number;

    sections: Array<ElevatorSectionModel>;

    tetherLength: number;
};
