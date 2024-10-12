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

import { StarSystemModel } from "./starSystemModel";
import { StarSystemCoordinates } from "../saveFile/universeCoordinates";
import { StellarObjectModel } from "../architecture/stellarObject";
import { PlanetModel } from "../architecture/planet";
import { AnomalyModel } from "../anomalies/anomaly";
import { TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";

export class CustomStarSystemModel implements StarSystemModel {
    readonly name: string;

    private readonly coordinates: StarSystemCoordinates;

    private readonly stellarObjectModels: StellarObjectModel[];

    private readonly planets: [PlanetModel, TelluricPlanetModel[]][];
    private readonly anomalies: AnomalyModel[];

    constructor(
        name: string,
        coordinates: StarSystemCoordinates,
        stellarObjects: StellarObjectModel[],
        planets: [PlanetModel, TelluricPlanetModel[]][],
        anomalies: AnomalyModel[]
    ) {
        this.name = name;

        this.coordinates = coordinates;

        this.stellarObjectModels = stellarObjects;
        this.planets = planets;
        this.anomalies = anomalies;
    }

    getCoordinates(): StarSystemCoordinates {
        return this.coordinates;
    }

    getNbStellarObjects(): number {
        return this.stellarObjectModels.length;
    }

    getStellarObjects(): StellarObjectModel[] {
        return this.stellarObjectModels;
    }

    getNbPlanets(): number {
        return this.planets.length;
    }

    getNbAnomalies(): number {
        return this.anomalies.length;
    }

    getAnomalies(): AnomalyModel[] {
        return this.anomalies;
    }

    getPlanet(): PlanetModel[] {
        return this.planets.map(([planet, moons]) => planet);
    }

    getSatellitesOfPlanet(index: number): TelluricPlanetModel[] {
        const planetAndSatellites = this.planets.at(index);
        if (planetAndSatellites === undefined) throw new Error("Planet out of bound! " + index);
        return planetAndSatellites[1];
    }

    getPlanetaryMassObjects(): PlanetModel[] {
        return this.planets.flatMap(([planet, moons]) => [planet, ...moons]);
    }
}
