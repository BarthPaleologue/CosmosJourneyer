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
import { SpaceStationModel } from "../spacestation/spacestationModel";

/**
 * Data model for a planetary system. It holds all the information necessary to generate and render a planetary system.
 * For example the Earth-Moon system is a planetary system, with the ISS orbiting the Earth.
 * Saturn and its satellites are another planetary system, with many satellites and no space stations (yet!).
 */
export type PlanetarySystemModel = {
    /**
     * The planets of the planetary system.
     * Usually, there is only one planet in the planetary system.
     * However, binary planets are possible, like Pluto and Charon
     */
    planets: PlanetModel[];
    /**
     * The satellites of the planet.
     */
    satellites: TelluricPlanetModel[];

    /**
     * The space stations orbiting the planet.
     */
    spaceStations: SpaceStationModel[];
};

/**
 * Data model for a sub star system. It holds all the information necessary to generate and render a sub star system.
 * A typical star system like Sol, which has a single star and planets orbiting it, a single sub star system can describe the whole star system.
 */
export type SubStarSystemModel = {
    /**
     * The stellar objects in the sub star system.
     * Usually, there is only one star in the sub star system.
     * However, we can imagine more complex scenarios like 2 neutron stars orbiting each other while having planets orbiting them from far away.
     */
    stellarObjects: StellarObjectModel[];

    /**
     * The planetary systems in the sub star system.
     */
    planetarySystems: PlanetarySystemModel[];

    /**
     * The anomalies in the sub star system.
     */
    anomalies: AnomalyModel[];

    /**
     * The space stations orbiting the stellar objects in the sub star system.
     */
    spaceStations: SpaceStationModel[];
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
     * They are used for identification purposes and to generate the star system.
     */
    readonly coordinates: StarSystemCoordinates;

    /**
     * Data models for system hierarchies inside the star system. (There can be multiple sub star systems in a star system, for example a binary star system).
     * Usually, there is only one sub star system with a single star.
     */
    readonly subSystems: SubStarSystemModel[];
};

/**
 * Utility class to manipulate star system models.
 */
export class StarSystemModelUtils {
    /**
     * Returns all the stellar objects in the star system.
     * @param starSystem The star system to get the stellar objects from.
     * @constructor
     */
    static GetStellarObjects(starSystem: StarSystemModel): StellarObjectModel[] {
        return starSystem.subSystems.flatMap((subSystem) => subSystem.stellarObjects);
    }

    /**
     * Returns all the planetary systems in the star system.
     * @param starSystem The star system to get the planetary systems from.
     * @constructor
     */
    static GetPlanetarySystems(starSystem: StarSystemModel): PlanetarySystemModel[] {
        return starSystem.subSystems.flatMap((subSystem) => subSystem.planetarySystems);
    }

    /**
     * Returns all the planets in the star system. (excluding satellites)
     * @param starSystem The star system to get the planets from.
     * @constructor
     */
    static GetPlanets(starSystem: StarSystemModel): PlanetModel[] {
        return starSystem.subSystems.flatMap((subSystem) => subSystem.planetarySystems.flatMap((planetarySystem) => planetarySystem.planets));
    }

    /**
     * Returns all space stations in the star system.
     * @param starSystem The star system to get the space stations from.
     * @constructor
     */
    static GetSpaceStations(starSystem: StarSystemModel): SpaceStationModel[] {
        const stellarSpaceStations = starSystem.subSystems.flatMap((subSystem) => subSystem.spaceStations);
        const planetarySpaceStations = starSystem.subSystems.flatMap((subSystem) => subSystem.planetarySystems.flatMap((planetarySystem) => planetarySystem.spaceStations));

        return stellarSpaceStations.concat(planetarySpaceStations);
    }

    /**
     * Returns all the planetary mass objects in the star system. (Planets first, then satellites)
     * @param starSystem The star system to get the planetary mass objects from.
     * @constructor
     */
    static GetPlanetaryMassObjects(starSystem: StarSystemModel): PlanetModel[] {
        const planets: PlanetModel[] = [];
        const satellites: PlanetModel[] = [];
        starSystem.subSystems.forEach((subSystem) =>
            subSystem.planetarySystems.forEach((planetarySystem) => {
                planets.push(...planetarySystem.planets);
                satellites.push(...planetarySystem.satellites);
            })
        );

        return planets.concat(satellites);
    }

    /**
     * Returns all the anomalies in the star system.
     * @param starSystem The star system to get the anomalies from.
     * @constructor
     */
    static GetAnomalies(starSystem: StarSystemModel): AnomalyModel[] {
        return starSystem.subSystems.flatMap((subSystem) => subSystem.anomalies);
    }
}
