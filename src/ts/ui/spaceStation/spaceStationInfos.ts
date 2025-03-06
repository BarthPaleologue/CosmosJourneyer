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

import { factionToString } from "../../society/factions";
import { CropType, cropTypeToString } from "../../utils/agriculture";
import { makeD3PieChart } from "../../utils/d3PieChart";
import { getOrbitalPeriod } from "../../orbit/orbit";
import { OrbitalFacilityModel, OrbitalObjectModel } from "../../architecture/orbitalObjectModel";

export function generateInfoHTML(model: OrbitalFacilityModel, parentModels: ReadonlyArray<OrbitalObjectModel>): string {
    const agricultureMix = model.agricultureMix;

    const parentName = parentModels.map((parentModel) => parentModel.name).join("-");

    const parentMassSum = parentModels.reduce((sum, parentModel) => sum + parentModel.mass, 0);

    const stationOrbitalPeriod = getOrbitalPeriod(model.orbit.semiMajorAxis, parentMassSum);

    return `
        <h2>General information</h2>
        
        <p>${model.name} is orbiting ${parentName} at a distance of ${(model.orbit.semiMajorAxis * 1e-3).toLocaleString(undefined, { maximumSignificantDigits: 3 })}km. 
        One orbit around ${parentName} takes ${(stationOrbitalPeriod / (24 * 60 * 60)).toLocaleString(undefined, { maximumSignificantDigits: 3 })} days</p>

        <p>${model.name} is affiliated to ${factionToString(model.faction)}</p>

        <p>It is the home to ${model.population.toLocaleString(undefined, { maximumSignificantDigits: 3 })} inhabitants, with a population density of ${model.populationDensity.toLocaleString(undefined, { maximumSignificantDigits: 3 })} per km²</p>

        <h2>Energy</h2>
        
        <p>The average energy consumption of a citizen of ${model.name} is about ${model.energyConsumptionPerCapitaKWh.toLocaleString()}KWh.</p>
        
        <p>The total energy consumption is then ${model.totalEnergyConsumptionKWh.toLocaleString()}KWh</p>
        
        <p>Most of the energy produced comes from solar panels, with an efficiency of ${model.solarPanelEfficiency}. The installed ${model.solarPanelSurfaceM2.toLocaleString(
            undefined,
            {
                maximumFractionDigits: 0,
                maximumSignificantDigits: 3
            }
        )}m² of solar panels cover the needs of the population.</p>

        <h2>Agriculture mix</h2>
        
        <p>
        Agriculture activities are performed using Hydroponics, which gives a very high yeild and is space-efficient thanks to vertical farming.
        ${model.agricultureSurfaceHa.toLocaleString()}Ha are used with ${model.nbHydroponicLayers} layers of hydroponics on top of that surface.
        </p>

        ${makeD3PieChart<[number, CropType]>(
            agricultureMix,
            ([proportion, _]) => proportion,
            ([_, cropType]) => cropTypeToString(cropType)
        )}
    `;
}
