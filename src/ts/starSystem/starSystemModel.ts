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

import { BodyType } from "../architecture/bodyType";
import { AnomalyType } from "../anomalies/anomalyType";

export interface StarSystemModel {
    readonly name: string;

    getNbStellarObjects(): number;
    getNbPlanets(): number;
    getNbAnomalies(): number;

    getStellarObjectSeed(index: number): number;
    getStellarObjects(): [BodyType, number][];
    getBodyTypeOfStellarObject(index: number): BodyType;

    getPlanetSeed(index: number): number;
    getPlanets(): [BodyType, number][];
    getBodyTypeOfPlanet(index: number): BodyType;

    getAnomalySeed(index: number): number;
    getAnomalies(): [AnomalyType, number][];
    getAnomalyType(index: number): AnomalyType;
}
