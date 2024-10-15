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

import { StarSystemCoordinates, StarSystemModel } from "./starSystemModel";
import { BodyType } from "../architecture/bodyType";
import { AnomalyType } from "../anomalies/anomalyType";

export class CustomStarSystemModel implements StarSystemModel {
    readonly name: string;

    private readonly coordinates: StarSystemCoordinates;

    readonly stellarObjects: [BodyType, number][];
    readonly planets: [BodyType, number][];
    readonly anomalies: [AnomalyType, number][];

    constructor(name: string, coordinates: StarSystemCoordinates, stellarObjects: [BodyType, number][], planets: [BodyType, number][], anomalies: [AnomalyType, number][]) {
        this.name = name;

        this.coordinates = coordinates;

        this.stellarObjects = stellarObjects;
        this.planets = planets;
        this.anomalies = anomalies;
    }

    getCoordinates(): StarSystemCoordinates {
        return this.coordinates;
    }

    getNbStellarObjects(): number {
        return this.stellarObjects.length;
    }

    getStellarObjectSeed(index: number): number {
        if (index > this.getNbStellarObjects()) throw new Error("Star out of bound! " + index);
        return this.stellarObjects[index][1];
    }

    getStellarObjects(): [BodyType, number][] {
        return this.stellarObjects;
    }

    getBodyTypeOfStellarObject(index: number): BodyType {
        if (index > this.getNbStellarObjects()) throw new Error("Star out of bound! " + index);
        return this.stellarObjects[index][0];
    }

    getNbPlanets(): number {
        return this.planets.length;
    }

    getPlanets(): [BodyType, number][] {
        return this.planets;
    }

    getPlanetSeed(index: number): number {
        if (index > this.getNbPlanets()) throw new Error("Planet out of bound! " + index);
        return this.planets[index][1];
    }

    getBodyTypeOfPlanet(index: number): BodyType {
        if (index > this.getNbPlanets()) throw new Error("Planet out of bound! " + index);
        return this.planets[index][0];
    }

    getNbAnomalies(): number {
        return this.anomalies.length;
    }

    getAnomalies(): [AnomalyType, number][] {
        return this.anomalies;
    }

    getAnomalySeed(index: number): number {
        if (index > this.getNbAnomalies()) throw new Error("Anomaly out of bound! " + index);
        return this.anomalies[index][1];
    }

    getAnomalyType(index: number): AnomalyType {
        if (index > this.getNbAnomalies()) throw new Error("Anomaly out of bound! " + index);
        return this.anomalies[index][0];
    }
}
