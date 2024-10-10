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

import { AnomalyType } from "../anomalies/anomalyType";
import { CelestialBodyType } from "../architecture/celestialBody";

/**
 * Describes the coordinates of a star system in the universe
 */
export type StarSystemCoordinates = {
    /**
     * Integer coordinates of the star sector along the universe X axis
     */
    readonly starSectorX: number;
    /**
     * Integer coordinates of the star sector along the universe Y axis
     */
    readonly starSectorY: number;
    /**
     * Integer coordinates of the star sector along the universe Z axis
     */
    readonly starSectorZ: number;
    /**
     * Floating point X coordinate of the star system inside the star sector. Must be between -0.5 and 0.5.
     */
    readonly localX: number;
    /**
     * Floating point Y coordinate of the star system inside the star sector. Must be between -0.5 and 0.5.
     */
    readonly localY: number;
    /**
     * Floating point Z coordinate of the star system inside the star sector. Must be between -0.5 and 0.5.
     */
    readonly localZ: number;
};

export function starSystemCoordinatesEquals(a: StarSystemCoordinates, b: StarSystemCoordinates): boolean {
    return (
        a.starSectorX === b.starSectorX &&
        a.starSectorY === b.starSectorY &&
        a.starSectorZ === b.starSectorZ &&
        a.localX === b.localX &&
        a.localY === b.localY &&
        a.localZ === b.localZ
    );
}

export interface StarSystemModel {
    readonly name: string;

    getCoordinates(): StarSystemCoordinates;

    getNbStellarObjects(): number;

    getNbPlanets(): number;

    getNbAnomalies(): number;

    getStellarObjectSeed(index: number): number;

    getStellarObjects(): [CelestialBodyType, number][];

    getBodyTypeOfStellarObject(index: number): CelestialBodyType;

    getPlanetSeed(index: number): number;

    getPlanets(): [CelestialBodyType, number][];

    getBodyTypeOfPlanet(index: number): CelestialBodyType;

    getAnomalySeed(index: number): number;

    getAnomalies(): [AnomalyType, number][];

    getAnomalyType(index: number): AnomalyType;
}
