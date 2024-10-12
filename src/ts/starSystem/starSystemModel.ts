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

import { StarSystemCoordinates } from "../saveFile/universeCoordinates";
import { StellarObjectModel } from "../architecture/stellarObject";
import { PlanetModel } from "../architecture/planet";
import { AnomalyModel } from "../anomalies/anomaly";
import { TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";

/**
 * Data model for a planetary system. It holds all the information necessary to generate and render a planetary system.
 */
export type PlanetarySystem = {
    /**
     * The planet of the planetary system.
     */
    planet: PlanetModel;
    /**
     * The satellites of the planet.
     */
    satellites: TelluricPlanetModel[];
};

/**
 * Data model for a star system. It holds all the information necessary to generate and render a star system.
 */
export type StarSystemModel = {
    /**
     * The name of the star system.
     */
    readonly name: string;

    /**
     * The coordinates of the star system in the universe.
     */
    readonly coordinates: StarSystemCoordinates;

    /**
     * The stellar objects in the star system.
     */
    readonly stellarObjects: StellarObjectModel[];

    /**
     * The planetary systems in the star system.
     */
    readonly planetarySystems: PlanetarySystem[];

    /**
     * The anomalies in the star system.
     */
    readonly anomalies: AnomalyModel[];
};

/**
 * Returns all the planets in the given star system (telluric planets and gas giants). Satellites are not included.
 * @param starSystem The star system to get the planets from.
 */
export function getPlanets(starSystem: StarSystemModel): PlanetModel[] {
    return starSystem.planetarySystems.map(({ planet }) => planet);
}

/**
 * Returns all the planetary mass objects in the given star system (telluric planets, gas planets and satellites).
 * @param starSystem The star system to get the planetary mass objects from.
 */
export function getPlanetaryMassObjects(starSystem: StarSystemModel): PlanetModel[] {
    return starSystem.planetarySystems.flatMap(({ planet, satellites }) => [planet, ...satellites]);
}
