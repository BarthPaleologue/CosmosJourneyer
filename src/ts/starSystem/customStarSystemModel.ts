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

import { PlanetarySystem, StarSystemModel } from "./starSystemModel";
import { StarSystemCoordinates } from "../saveFile/universeCoordinates";
import { StellarObjectModel } from "../architecture/stellarObject";
import { AnomalyModel } from "../anomalies/anomaly";

export class CustomStarSystemModel implements StarSystemModel {
    readonly name: string;

    readonly coordinates: StarSystemCoordinates;

    readonly stellarObjects: StellarObjectModel[];

    readonly planetarySystems: PlanetarySystem[];

    readonly anomalies: AnomalyModel[];

    constructor(name: string, coordinates: StarSystemCoordinates, stellarObjects: StellarObjectModel[], planetarySystems: PlanetarySystem[], anomalies: AnomalyModel[]) {
        this.name = name;

        this.coordinates = coordinates;

        this.stellarObjects = stellarObjects;
        this.planetarySystems = planetarySystems;
        this.anomalies = anomalies;
    }
}
