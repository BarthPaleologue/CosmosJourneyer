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

import type { Vector3 } from "@babylonjs/core/Maths/math.vector";

import type { DeepReadonly } from "@/utils/types";

import type { OrbitalObjectModel } from "./orbitalObjects";
import type { StarSystemCoordinates } from "./starSystemCoordinates";
import type { StarSystemModel } from "./starSystemModel";
import type { UniverseObjectId } from "./universeObjectId";

export type SingleSystemModelPlugin = (systemModel: StarSystemModel) => StarSystemModel;

export interface IUniverseBackend {
    getFallbackSystem: () => DeepReadonly<StarSystemModel>;

    /**
     * Adds the given system to the database
     * @param system The system to register
     */
    registerCustomSystem(system: StarSystemModel): void;

    /**
     * Register a plugin that modifies a single system.
     * @param coordinates The coordinates of the system to modify.
     * @param plugin The plugin to apply to the system.
     */
    registerSinglePlugin(coordinates: DeepReadonly<StarSystemCoordinates>, plugin: SingleSystemModelPlugin): void;

    /**
     * @param coordinates The coordinates of the system you want the model of.
     * @returns The StarSystemModel for the given coordinates, or null if the system is not found.
     */
    getSystemModelFromCoordinates(coordinates: StarSystemCoordinates): DeepReadonly<StarSystemModel> | null;

    /**
     * @param sectorX
     * @param sectorY
     * @param sectorZ
     * @returns The coordinates of the systems in the given star sector.
     */
    getSystemCoordinatesInStarSector(
        sectorX: number,
        sectorY: number,
        sectorZ: number,
    ): DeepReadonly<Array<StarSystemCoordinates>>;

    /**
     * @param sectorX
     * @param sectorY
     * @param sectorZ
     * @returns All system models (custom and generated) in the given star sector.
     */
    getSystemModelsInStarSector(
        sectorX: number,
        sectorY: number,
        sectorZ: number,
    ): DeepReadonly<Array<StarSystemModel>>;

    /**
     * @param starSectorX
     * @param starSectorY
     * @param starSectorZ
     * @param index The index of the generated system in the star sector.
     * @returns The system coordinates of the system generated given the seed.
     */
    getSystemCoordinatesFromSeed(
        starSectorX: number,
        starSectorY: number,
        starSectorZ: number,
        index: number,
    ): StarSystemCoordinates;

    /**
     * @param starSectorX
     * @param starSectorY
     * @param starSectorZ
     * @param index The index of the generated system in the star sector.
     * @returns The system model of the system generated given the seed, or null if the system is not found.
     */
    getSystemModelFromSeed(
        starSectorX: number,
        starSectorY: number,
        starSectorZ: number,
        index: number,
    ): DeepReadonly<StarSystemModel> | null;

    /**
     * @param coordinates The coordinates of the system you want the position of.
     * @returns The position of the given system in the galaxy.
     */
    getSystemGalacticPosition(coordinates: StarSystemCoordinates): Vector3;

    /**
     * @param sectorX
     * @param sectorY
     * @param sectorZ
     * @returns The positions of all systems in the given star sector in galactic space.
     */
    getSystemPositionsInStarSector(sectorX: number, sectorY: number, sectorZ: number): Array<Vector3>;

    /**
     * Searches the database for the given id
     * @param universeObjectId The id to look for
     * @param starSystemDatabase The database to look in
     * @returns The model if it exists, null otherwise
     */
    getObjectModelByUniverseId(universeObjectId: UniverseObjectId): DeepReadonly<OrbitalObjectModel> | null;

    /**
     * Check if a system is in the human bubble.
     * @param systemCoordinates The coordinates of the system to check.
     * @returns true if the system is in the human bubble, false otherwise.
     */
    isSystemInHumanBubble(systemCoordinates: StarSystemCoordinates): boolean;
}
