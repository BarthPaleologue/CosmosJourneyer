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

import { SpaceStationModel } from "../../spacestation/spacestationModel";
import { CropType, cropTypeToString } from "../../utils/agriculture";

import { makeD3PieChart } from "../../utils/d3PieChart";

export function generateInfoHTML(model: SpaceStationModel): string {
    const agricultureMix = model.agricultureMix;

    return `
        <h2>General information</h2>
        
        <p>${model.name} is orbiting ${model.parentBody?.name} at a distance of ${(model.orbit.radius * 0.001).toLocaleString(undefined, { maximumSignificantDigits: 3 })}km</p>

        <p>It is the home to ${model.population.toLocaleString(undefined, { maximumSignificantDigits: 3 })} inhabitants, with a population density of ${model.populationDensity.toLocaleString(undefined, { maximumSignificantDigits: 3 })} per km²</p>

        <h2>Agriculture mix</h2>

        ${makeD3PieChart<[number, CropType]>(
            agricultureMix,
            ([proportion, _]) => proportion,
            ([_, cropType]) => cropTypeToString(cropType)
        )}
    `;
}
