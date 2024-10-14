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

import { CelestialBody, CelestialBodyModel } from "./celestialBody";
import { PlanetPhysicalProperties } from "./physicalProperties";
import { Transformable } from "./transformable";
import { OrbitalObjectType } from "./orbitalObject";

export interface Planet extends CelestialBody {
    model: PlanetModel;

    updateMaterial(stellarObjects: Transformable[], deltaSeconds: number): void;
}

export type PlanetModel = CelestialBodyModel & {
    readonly type: OrbitalObjectType.TELLURIC_PLANET | OrbitalObjectType.GAS_PLANET | OrbitalObjectType.TELLURIC_SATELLITE;

    physicalProperties: PlanetPhysicalProperties;
};

export function hasAtmosphere(planetModel: PlanetModel): boolean {
    return planetModel.physicalProperties.pressure > 0.05;
}
