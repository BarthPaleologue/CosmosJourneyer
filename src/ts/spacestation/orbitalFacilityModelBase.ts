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

import { OrbitalObjectModelBase } from "../architecture/orbitalObjectModelBase";
import { OrbitalObjectType } from "../architecture/orbitalObjectType";
import { Faction } from "../society/factions";
import { CropType } from "../utils/agriculture";
import { StarSystemCoordinates } from "../utils/coordinates/starSystemCoordinates";

export type OrbitalFacilityModelBase<T extends OrbitalObjectType> = OrbitalObjectModelBase<T> & {
    readonly starSystemCoordinates: StarSystemCoordinates;

    readonly population: number;

    /**
     * The average energy consumption of a citizen of the habitat in KWh
     */
    readonly energyConsumptionPerCapitaKWh: number;

    /**
     * The number of inhabitants per square kilometer in the habitat
     */
    readonly populationDensity: number;

    readonly agricultureMix: [number, CropType][];

    readonly nbHydroponicLayers: number;

    readonly faction: Faction;

    /**
     * The total energy consumption of the habitat in KWh
     */
    readonly totalEnergyConsumptionKWh: number;
    readonly solarPanelEfficiency: number;

    /**
     * The surface of solar panels in m²
     */
    readonly solarPanelSurfaceM2: number;

    readonly housingSurfaceHa: number;
    readonly agricultureSurfaceHa: number;
    readonly totalHabitatSurfaceM2: number;
};
