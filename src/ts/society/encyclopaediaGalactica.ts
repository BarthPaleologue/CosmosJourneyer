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

import { OrbitalObjectType } from "../architecture/orbitalObject";
import { TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { getObjectModelByUniverseId } from "../utils/coordinates/orbitalObjectId";
import { getStarGalacticPosition } from "../utils/coordinates/starSystemCoordinatesUtils";
import { UniverseObjectId } from "../utils/coordinates/universeCoordinates";
import { GasPlanetModel } from "../planets/gasPlanet/gasPlanetModel";
import { TelluricSatelliteModel } from "../planets/telluricPlanet/telluricSatelliteModel";

/**
 * Information about a space discovery
 */
export type SpaceDiscoveryData = {
    /**
     * The ID of the object discovered.
     */
    objectId: UniverseObjectId;
    /**
     * The timestamp at which the object was discovered.
     */
    discoveryTimestamp: number;
    /**
     * The name of the explorer who discovered the object.
     */
    explorerName: string;
};

/**
 * Database holding all the exploration data gathered by players.
 */
export class EncyclopaediaGalactica {
    /**
     * This maps object IDs (as JSON strings) to the data gathered about them.
     */
    private readonly spaceExplorationData: Map<string, SpaceDiscoveryData> = new Map();

    /**
     * Because an object has already been discovered does not mean new data on it has no value.
     * This is the symbolic price of redundant data.
     */
    private readonly redundantDataPrice = 100;

    /**
     * Tries to add a new astronomical object to the database under the given explorer name.
     * @param data The space exploration data to add.
     * @returns True if the object was added, false if it was already present.
     */
    public contributeDiscoveryIfNew(data: SpaceDiscoveryData) {
        const key = JSON.stringify(data.objectId);

        const previousData = this.spaceExplorationData.get(key);
        if (previousData !== undefined && previousData.discoveryTimestamp >= data.discoveryTimestamp) {
            return false; // The object was already discovered and the new data is older.
        }

        this.spaceExplorationData.set(key, data);
        return true;
    }

    public hasObjectBeenDiscovered(objectId: UniverseObjectId) {
        return this.spaceExplorationData.has(JSON.stringify(objectId));
    }

    private evaluateTelluricPlanetMultiplier(model: TelluricPlanetModel) {
        let multiplier = 1;
        if (model.clouds !== null) multiplier += 1.0;
        if (model.rings !== null) multiplier += 1.0;

        return multiplier;
    }

    private evaluateTelluricSatelliteMultiplier(model: TelluricSatelliteModel) {
        let multiplier = 0.5;
        if (model.clouds !== null) multiplier += 1.0;
        if (model.rings !== null) multiplier += 1.0;

        return multiplier;
    }

    private evaluateGasPlanetMultiplier(model: GasPlanetModel) {
        let multiplier = 1;
        if (model.rings !== null) multiplier += 1.0;

        return multiplier;
    }

    /**
     * Estimates the value of an astronomical object given the current encyclopaedia data.
     * @param object The object to evaluate.
     * @returns The estimated value of the object in credits.
     */
    public evaluate(object: UniverseObjectId) {
        if (this.hasObjectBeenDiscovered(object)) {
            return this.redundantDataPrice;
        }

        const model = getObjectModelByUniverseId(object);
        const systemGalacticPosition = getStarGalacticPosition(object.starSystemCoordinates);

        const distanceFromSolLy = systemGalacticPosition.length();

        const valueFromDistance = distanceFromSolLy * 100;

        let objectTypeMultiplier: number;
        switch (model.type) {
            case OrbitalObjectType.STAR:
                objectTypeMultiplier = 1;
                break;
            case OrbitalObjectType.NEUTRON_STAR:
                objectTypeMultiplier = 8;
                break;
            case OrbitalObjectType.BLACK_HOLE:
                objectTypeMultiplier = 10;
                break;
            case OrbitalObjectType.TELLURIC_PLANET:
                objectTypeMultiplier = this.evaluateTelluricPlanetMultiplier(model as TelluricPlanetModel);
                break;
            case OrbitalObjectType.TELLURIC_SATELLITE:
                objectTypeMultiplier = this.evaluateTelluricSatelliteMultiplier(model as TelluricSatelliteModel);
                break;
            case OrbitalObjectType.GAS_PLANET:
                objectTypeMultiplier = this.evaluateGasPlanetMultiplier(model as GasPlanetModel);
                break;
            case OrbitalObjectType.MANDELBULB:
                objectTypeMultiplier = 2;
                break;
            case OrbitalObjectType.JULIA_SET:
                objectTypeMultiplier = 2;
                break;
            case OrbitalObjectType.SPACE_STATION:
            case OrbitalObjectType.SPACE_ELEVATOR:
                objectTypeMultiplier = 0;
                break;
        }

        return valueFromDistance * objectTypeMultiplier;
    }

    public reset() {
        this.spaceExplorationData.clear();
    }
}
