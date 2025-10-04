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

import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";

import { type DeepReadonly, type NonEmptyArray } from "@/utils/types";

import {
    type AnomalyModel,
    type OrbitalFacilityModel,
    type OrbitalObjectModel,
    type PlanetModel,
    type StellarObjectModel,
} from "./orbitalObjects/index";
import { type OrbitalObjectId } from "./orbitalObjects/orbitalObjectId";
import { type TelluricSatelliteModel } from "./orbitalObjects/telluricSatelliteModel";

/**
 * Data model for a star system. It holds all the information necessary to generate and render a star system.
 */
export type StarSystemModel = {
    /**
     * The name of the star system.
     */
    name: string;

    /**
     * The coordinates of the star system in the universe.
     * They are used for identification purposes and to generate the star system.
     */
    coordinates: StarSystemCoordinates;

    /**
     * The stellar objects in the star systems (Stars, black holes, etc.)
     */
    stellarObjects: NonEmptyArray<StellarObjectModel>;

    /**
     * The planets of the star system.
     */
    planets: Array<PlanetModel>;

    /**
     * The natural satellites of the planets in the star system.
     */
    satellites: Array<TelluricSatelliteModel>;

    /**
     * The orbital anomalies in the star system.
     */
    anomalies: Array<AnomalyModel>;

    /**
     * The orbital facilities in the star system (space station, space elevators, etc.)
     */
    orbitalFacilities: Array<OrbitalFacilityModel>;
};

/**
 * Finds the object model corresponding to the given id in the given system model
 * @param id The id to look for
 * @param starSystem The star system model to look in
 * @returns The model if it exists, null otherwise
 */
export function getObjectModelById(
    id: OrbitalObjectId,
    starSystem: DeepReadonly<StarSystemModel>,
): DeepReadonly<OrbitalObjectModel> | null {
    const stellarObject = starSystem.stellarObjects.find((object) => object.id === id);
    if (stellarObject !== undefined) {
        return stellarObject;
    }

    const planet = starSystem.planets.find((object) => object.id === id);
    if (planet !== undefined) {
        return planet;
    }

    const satellite = starSystem.satellites.find((object) => object.id === id);
    if (satellite !== undefined) {
        return satellite;
    }

    const anomaly = starSystem.anomalies.find((object) => object.id === id);
    if (anomaly !== undefined) {
        return anomaly;
    }

    const orbitalFacility = starSystem.orbitalFacilities.find((object) => object.id === id);
    if (orbitalFacility !== undefined) {
        return orbitalFacility;
    }

    return null;
}
