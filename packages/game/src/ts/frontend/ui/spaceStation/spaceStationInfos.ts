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

import { factionToString } from "@/backend/society/factions";
import { type OrbitalFacilityModel, type OrbitalObjectModel } from "@/backend/universe/orbitalObjects/index";

import { makeD3PieChart } from "@/frontend/helpers/d3PieChart";

import { type CropType } from "@/utils/agriculture";
import { getOrbitalPeriod } from "@/utils/physics/orbit";
import { type DeepReadonly } from "@/utils/types";

export function generateInfoHTML(
    model: DeepReadonly<OrbitalFacilityModel>,
    parentModels: DeepReadonly<Array<OrbitalObjectModel>>,
): string {
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

        <h2>Agriculture mix</h2>

        ${makeD3PieChart<[number, CropType]>(
            agricultureMix,
            ([proportion]) => proportion,
            ([, cropType]) => cropType,
        )}
    `;
}
