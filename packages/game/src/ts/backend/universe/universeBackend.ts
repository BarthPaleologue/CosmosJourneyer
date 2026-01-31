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

import { centeredRand } from "extended-random";
import { makeNoise3D } from "fast-simplex-noise/lib/3d";

import { starSystemCoordinatesEquals, type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type UniverseObjectId } from "@/backend/universe/universeObjectId";

import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { hashVec3 } from "@/utils/hash";
import { type DeepReadonly, type Vector3Like } from "@/utils/types";

import { Settings } from "@/settings";

import { type OrbitalObjectModel } from "./orbitalObjects/index";
import { newSeededStarSystemModel } from "./proceduralGenerators/starSystemModelGenerator";
import { getObjectModelById, type StarSystemModel } from "./starSystemModel";

/**
 * The UniverseBackend defines the content of the universe.
 * It is responsible for generating star system models and system positions in the galaxy.
 */
export class UniverseBackend {
    /**
     * Maps star sectors to the custom systems they contain.
     */
    private readonly starSectorToCustomSystems: Map<string, StarSystemModel[]> = new Map();

    /**
     * Maps coordinates to custom systems.
     */
    private readonly coordinatesToCustomSystems: Map<string, StarSystemModel> = new Map();

    /**
     * Maps coordinates to plugins that modify the system at these coordinates.
     */
    private readonly coordinatesToSinglePlugins: Map<string, (systemModel: StarSystemModel) => StarSystemModel> =
        new Map();

    /**
     * List plugins that can modify multiple systems at once
     */
    private readonly generalPlugins: {
        /**
         * @param systemModel The system model to test.
         * @returns true if the plugin should apply to the given system, false otherwise.
         */
        predicate: (systemModel: StarSystemModel) => boolean;
        /**
         * The plugin to apply to the system.
         * @param systemModel The system model to modify.
         * @returns A pointer to the modified system model, or a new system model.
         */
        plugin: (systemModel: StarSystemModel) => StarSystemModel;
    }[] = [];

    /**
     * Function that returns the density of the universe in a given star sector.
     */
    private readonly universeDensity: (starSectorX: number, starSectorY: number, starSectorZ: number) => number;

    /**
     * Fallback system that is guaranteed to exist
     * This can be useful for default mechanisms relying on finding a system in the database if nothing is found
     */
    readonly fallbackSystem: DeepReadonly<StarSystemModel>;

    constructor(fallbackSystem: StarSystemModel) {
        const densityRng = getRngFromSeed(Settings.UNIVERSE_SEED);
        let densitySampleStep = 0;
        const densityPerlin = makeNoise3D(() => {
            return densityRng(densitySampleStep++);
        });

        this.universeDensity = (x: number, y: number, z: number) =>
            (1.0 - Math.abs(densityPerlin(x * 0.2, y * 0.2, z * 0.2))) ** 8;

        this.fallbackSystem = fallbackSystem;
    }

    /**
     * Converts a star sector to a string. This is useful for using the star sector as a key in a map.
     * @param sectorX
     * @param sectorY
     * @param sectorZ
     * @returns A string representation of the star sector.
     */
    private starSectorToString(sectorX: number, sectorY: number, sectorZ: number): string {
        return `${sectorX}|${sectorY}|${sectorZ}`;
    }

    /**
     * Adds the given system to the database
     * @param system The system to register
     */
    public registerCustomSystem(system: StarSystemModel) {
        const sectorKey = this.starSectorToString(
            system.coordinates.starSectorX,
            system.coordinates.starSectorY,
            system.coordinates.starSectorZ,
        );
        const systems = this.starSectorToCustomSystems.get(sectorKey);
        if (systems === undefined) {
            this.starSectorToCustomSystems.set(sectorKey, [system]);
        } else {
            systems.push(system);
        }

        this.coordinatesToCustomSystems.set(JSON.stringify(system.coordinates), system);
    }

    /**
     * @param sectorX
     * @param sectorY
     * @param sectorZ
     * @returns The list of only the custom systems in the given sector.
     */
    private getCustomSystemsFromSector(sectorX: number, sectorY: number, sectorZ: number): StarSystemModel[] {
        const sectorKey = this.starSectorToString(sectorX, sectorY, sectorZ);
        const systems = this.starSectorToCustomSystems.get(sectorKey);
        if (systems === undefined) {
            return [];
        }
        return systems;
    }

    private getCustomSystemFromCoordinates(coordinates: StarSystemCoordinates): StarSystemModel | undefined {
        return this.coordinatesToCustomSystems.get(JSON.stringify(coordinates));
    }

    /**
     * Register a plugin that modifies a single system.
     * @param coordinates The coordinates of the system to modify.
     * @param plugin The plugin to apply to the system.
     */
    public registerSinglePlugin(
        coordinates: StarSystemCoordinates,
        plugin: (systemModel: StarSystemModel) => StarSystemModel,
    ) {
        this.coordinatesToSinglePlugins.set(JSON.stringify(coordinates), plugin);
    }

    /**
     * Register a plugin that modifies multiple systems.
     * @param predicate The predicate used to match systems.
     * @param plugin The plugin to apply to the matched systems.
     */
    public registerGeneralPlugin(
        predicate: (systemModel: StarSystemModel) => boolean,
        plugin: (systemModel: StarSystemModel) => StarSystemModel,
    ) {
        this.generalPlugins.push({ predicate, plugin });
    }

    /**
     * Check if a system is in the human bubble.
     * @param systemCoordinates The coordinates of the system to check.
     * @returns true if the system is in the human bubble, false otherwise.
     */
    public isSystemInHumanBubble(systemCoordinates: StarSystemCoordinates): boolean {
        const systemPosition = this.getSystemGalacticPosition(systemCoordinates);
        const distanceToSolLy = Math.hypot(systemPosition.x, systemPosition.y, systemPosition.z);

        return distanceToSolLy < Settings.HUMAN_BUBBLE_RADIUS_LY;
    }

    /**
     * @param coordinates The coordinates of the system you want the model of.
     * @returns The StarSystemModel for the given coordinates, or null if the system is not found.
     */
    public getSystemModelFromCoordinates(coordinates: StarSystemCoordinates): DeepReadonly<StarSystemModel> | null {
        if (starSystemCoordinatesEquals(coordinates, this.fallbackSystem.coordinates)) {
            return this.fallbackSystem;
        }

        const customSystem = this.getCustomSystemFromCoordinates(coordinates);
        if (customSystem !== undefined) {
            return this.applyPlugins(customSystem);
        }

        const generatedSystemCoordinates = this.getGeneratedSystemCoordinatesInStarSector(
            coordinates.starSectorX,
            coordinates.starSectorY,
            coordinates.starSectorZ,
        );
        const index = generatedSystemCoordinates.findIndex((otherCoordinates) =>
            starSystemCoordinatesEquals(coordinates, otherCoordinates),
        );
        if (index === -1) {
            return null;
        }

        // init pseudo-random number generator
        const cellRNG = getRngFromSeed(
            hashVec3(coordinates.starSectorX, coordinates.starSectorY, coordinates.starSectorZ),
        );
        const hash = centeredRand(cellRNG, 1 + index) * Settings.SEED_HALF_RANGE;
        const systemRng = getRngFromSeed(hash);

        return this.applyPlugins(
            newSeededStarSystemModel(systemRng, coordinates, this.isSystemInHumanBubble(coordinates)),
        );
    }

    private getGeneratedSystemCoordinatesInStarSector(sectorX: number, sectorY: number, sectorZ: number) {
        const localPositions = this.getGeneratedLocalPositionsInStarSector(sectorX, sectorY, sectorZ);

        return localPositions.map((localPosition) => {
            return {
                starSectorX: sectorX,
                starSectorY: sectorY,
                starSectorZ: sectorZ,
                localX: localPosition.x,
                localY: localPosition.y,
                localZ: localPosition.z,
            };
        });
    }

    /**
     * @param sectorX
     * @param sectorY
     * @param sectorZ
     * @returns The coordinates of the systems in the given star sector.
     */
    public getSystemCoordinatesInStarSector(
        sectorX: number,
        sectorY: number,
        sectorZ: number,
    ): DeepReadonly<Array<StarSystemCoordinates>> {
        const result: Array<DeepReadonly<StarSystemCoordinates>> = [];
        const generatedSystemCoordinates = this.getGeneratedSystemCoordinatesInStarSector(sectorX, sectorY, sectorZ);
        result.push(...generatedSystemCoordinates);

        const customSystemModels = this.getCustomSystemsFromSector(sectorX, sectorY, sectorZ);
        const customSystemCoordinates = customSystemModels.map((model) => {
            return model.coordinates;
        });
        result.push(...customSystemCoordinates);

        if (
            this.fallbackSystem.coordinates.starSectorX === sectorX &&
            this.fallbackSystem.coordinates.starSectorY === sectorY &&
            this.fallbackSystem.coordinates.starSectorZ === sectorZ
        ) {
            result.push(this.fallbackSystem.coordinates);
        }

        return result;
    }

    /**
     * @param sectorX
     * @param sectorY
     * @param sectorZ
     * @returns All system models (custom and generated) in the given star sector.
     */
    public getSystemModelsInStarSector(
        sectorX: number,
        sectorY: number,
        sectorZ: number,
    ): DeepReadonly<Array<StarSystemModel>> {
        const generatedModels: DeepReadonly<StarSystemModel>[] = [];

        const generatedSystemCoordinates = this.getGeneratedSystemCoordinatesInStarSector(sectorX, sectorY, sectorZ);

        for (const systemCoordinates of generatedSystemCoordinates) {
            const systemModel = this.getSystemModelFromCoordinates(systemCoordinates);
            if (systemModel === null) {
                throw new Error("Generated system not found in the database!");
            }
            generatedModels.push(systemModel);
        }

        const customSystemModels = this.getCustomSystemsFromSector(sectorX, sectorY, sectorZ);

        const customSystemsAfterPlugins = customSystemModels.map((model) => this.applyPlugins(model));

        if (
            this.fallbackSystem.coordinates.starSectorX === sectorX &&
            this.fallbackSystem.coordinates.starSectorY === sectorY &&
            this.fallbackSystem.coordinates.starSectorZ === sectorZ
        ) {
            customSystemsAfterPlugins.push(this.fallbackSystem);
        }

        return generatedModels.concat(customSystemsAfterPlugins);
    }

    /**
     * @param starSectorX
     * @param starSectorY
     * @param starSectorZ
     * @param index The index of the generated system in the star sector.
     * @returns The system coordinates of the system generated given the seed.
     */
    public getSystemCoordinatesFromSeed(
        starSectorX: number,
        starSectorY: number,
        starSectorZ: number,
        index: number,
    ): StarSystemCoordinates {
        const systemLocalPositions = this.getGeneratedLocalPositionsInStarSector(starSectorX, starSectorY, starSectorZ);
        const systemLocalPosition = systemLocalPositions.at(index);
        if (systemLocalPosition === undefined) {
            throw new Error(
                `Local position not found for seed ${index} in star sector ${starSectorX}, ${starSectorY}, ${starSectorZ}`,
            );
        }

        return {
            starSectorX: starSectorX,
            starSectorY: starSectorY,
            starSectorZ: starSectorZ,
            localX: systemLocalPosition.x,
            localY: systemLocalPosition.y,
            localZ: systemLocalPosition.z,
        };
    }

    /**
     * @param starSectorX
     * @param starSectorY
     * @param starSectorZ
     * @param index The index of the generated system in the star sector.
     * @returns The system model of the system generated given the seed, or null if the system is not found.
     */
    public getSystemModelFromSeed(starSectorX: number, starSectorY: number, starSectorZ: number, index: number) {
        const coordinates = this.getSystemCoordinatesFromSeed(starSectorX, starSectorY, starSectorZ, index);
        return this.getSystemModelFromCoordinates(coordinates);
    }

    /**
     * @param coordinates The coordinates of the system you want the position of.
     * @returns The position of the given system in the galaxy.
     */
    public getSystemGalacticPosition(coordinates: StarSystemCoordinates): Vector3Like {
        return {
            x: (coordinates.starSectorX + coordinates.localX) * Settings.STAR_SECTOR_SIZE,
            y: (coordinates.starSectorY + coordinates.localY) * Settings.STAR_SECTOR_SIZE,
            z: (coordinates.starSectorZ + coordinates.localZ) * Settings.STAR_SECTOR_SIZE,
        };
    }

    /**
     * @param sectorX
     * @param sectorY
     * @param sectorZ
     * @returns The list of all local positions of generated systems in the given star sector (range is [-0.5, 0.5]).
     */
    private getGeneratedLocalPositionsInStarSector(
        sectorX: number,
        sectorY: number,
        sectorZ: number,
    ): Array<Vector3Like> {
        const rng = getRngFromSeed(hashVec3(sectorX, sectorY, sectorZ));

        const density = this.universeDensity(sectorX, sectorY, sectorZ);

        const nbGeneratedStars = 40 * density * rng(0);

        const localPositions: Array<Vector3Like> = [];

        for (let i = 0; i < nbGeneratedStars; i++) {
            const starLocalPosition = {
                x: centeredRand(rng, 10 * i + 1) / 2,
                y: centeredRand(rng, 10 * i + 2) / 2,
                z: centeredRand(rng, 10 * i + 3) / 2,
            };

            localPositions.push(starLocalPosition);
        }

        return localPositions;
    }

    /**
     * @param sectorX
     * @param sectorY
     * @param sectorZ
     * @returns The list of all local positions of systems in the given star sector (range is [-0.5, 0.5]).
     */
    private getSystemLocalPositionsInStarSector(sectorX: number, sectorY: number, sectorZ: number): Array<Vector3Like> {
        const localPositions: Array<Vector3Like> = [];

        localPositions.push(...this.getGeneratedLocalPositionsInStarSector(sectorX, sectorY, sectorZ));

        if (
            this.fallbackSystem.coordinates.starSectorX === sectorX &&
            this.fallbackSystem.coordinates.starSectorY === sectorY &&
            this.fallbackSystem.coordinates.starSectorZ === sectorZ
        ) {
            localPositions.push({
                x: this.fallbackSystem.coordinates.localX,
                y: this.fallbackSystem.coordinates.localY,
                z: this.fallbackSystem.coordinates.localZ,
            });
        }

        const customSystemModels = this.getCustomSystemsFromSector(sectorX, sectorY, sectorZ);

        for (const systemModel of customSystemModels) {
            localPositions.push({
                x: systemModel.coordinates.localX,
                y: systemModel.coordinates.localY,
                z: systemModel.coordinates.localZ,
            });
        }

        return localPositions;
    }

    /**
     * @param sectorX
     * @param sectorY
     * @param sectorZ
     * @returns The positions of all systems in the given star sector in galactic space.
     */
    public getSystemPositionsInStarSector(sectorX: number, sectorY: number, sectorZ: number): Array<Vector3Like> {
        const localPositions = this.getSystemLocalPositionsInStarSector(sectorX, sectorY, sectorZ);

        const sectorPosition = { x: sectorX, y: sectorY, z: sectorZ };

        return localPositions.map((localPosition) => {
            return {
                x: (localPosition.x + sectorPosition.x) * Settings.STAR_SECTOR_SIZE,
                y: (localPosition.y + sectorPosition.y) * Settings.STAR_SECTOR_SIZE,
                z: (localPosition.z + sectorPosition.z) * Settings.STAR_SECTOR_SIZE,
            };
        });
    }

    /**
     * Searches the database for the given id
     * @param universeObjectId The id to look for
     * @returns The model if it exists, null otherwise
     */
    public getObjectModelByUniverseId(universeObjectId: UniverseObjectId): DeepReadonly<OrbitalObjectModel> | null {
        const starSystemCoordinates = universeObjectId.systemCoordinates;
        const starSystemModel = this.getSystemModelFromCoordinates(starSystemCoordinates);
        if (starSystemModel === null) {
            return null;
        }

        return getObjectModelById(universeObjectId.idInSystem, starSystemModel);
    }

    /**
     * @param model The system model to apply the plugins to.
     * @returns The modified system model, or a new system model.
     */
    private applyPlugins(model: StarSystemModel): DeepReadonly<StarSystemModel> {
        let newModel = model;
        const singlePlugin = this.coordinatesToSinglePlugins.get(JSON.stringify(model.coordinates));
        if (singlePlugin !== undefined) {
            newModel = singlePlugin(model);
        }

        for (const generalPlugin of this.generalPlugins) {
            if (generalPlugin.predicate(newModel)) {
                newModel = generalPlugin.plugin(newModel);
            }
        }

        return newModel;
    }
}
