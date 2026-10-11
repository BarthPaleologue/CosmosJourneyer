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

import { centeredRand, makeNoise3D, getRngFromSeed } from "@cosmos-journeyer/random";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import { generateStarSystemModel } from "@cosmos-journeyer/universe-generation";
import {
    starSystemCoordinatesEquals,
    getObjectModelById,
    serializeStarSystemCoordinates,
    serializeStarSectorCoordinates,
} from "@cosmos-journeyer/universe-model";
import type {
    StarSystemCoordinates,
    UniverseObjectId,
    OrbitalObjectModel,
    StarSystemModel,
} from "@cosmos-journeyer/universe-model";

import { hashVec3 } from "@/utils/hash";
import type { Vector3Like } from "@/utils/types";

import { Settings } from "@/settings";

import type { SystemEntityBackend, SystemEntityModelGenerator } from "../systemEntity/systemEntityBackend";
import type { SystemEntityModel } from "../systemEntity/systemEntityModel";

export type StarSystemContentModel = {
    system: StarSystemModel;
    entities: Array<SystemEntityModel>;
};

export type UniverseObjectModel =
    | {
          type: "orbitalObject";
          object: OrbitalObjectModel;
      }
    | {
          type: "systemEntity";
          object: SystemEntityModel;
      };

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
     * Function that returns the density of the universe in a given star sector.
     */
    private readonly universeDensity: (starSectorX: number, starSectorY: number, starSectorZ: number) => number;

    /**
     * Fallback system that is guaranteed to exist
     * This can be useful for default mechanisms relying on finding a system in the database if nothing is found
     */
    readonly fallbackSystem: DeepReadonly<StarSystemModel>;

    private readonly systemEntities: SystemEntityBackend;

    constructor(systemEntityBackend: SystemEntityBackend, fallbackSystem: StarSystemModel) {
        this.systemEntities = systemEntityBackend;

        const densityRng = getRngFromSeed(Settings.UNIVERSE_SEED);
        let densitySampleStep = 0;
        const densityPerlin = makeNoise3D(() => {
            return densityRng(densitySampleStep++);
        });

        this.universeDensity = (x: number, y: number, z: number): number =>
            (1.0 - Math.abs(densityPerlin(x * 0.2, y * 0.2, z * 0.2))) ** 8;

        this.fallbackSystem = fallbackSystem;
    }

    /**
     * Adds the given system to the database
     * @param system - The system to register
     */
    public registerAuthoredSystem(system: StarSystemModel): void {
        const sectorKey = serializeStarSectorCoordinates(
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

        this.coordinatesToCustomSystems.set(serializeStarSystemCoordinates(system.coordinates), system);
    }

    public registerAuthoredEntities(
        coordinates: StarSystemCoordinates,
        entities: Iterable<DeepReadonly<SystemEntityModel>>,
    ) {
        this.systemEntities.registerAuthored(coordinates, entities);
    }

    public registerProceduralEntities(generator: SystemEntityModelGenerator) {
        this.systemEntities.registerProcedural(generator);
    }

    /**
     * Selects custom system models assigned to the given star sector.
     * @param sectorX - The coordinate of the sector to query.
     * @param sectorY - The coordinate of the sector to query.
     * @param sectorZ - The coordinate of the sector to query.
     * @returns Read-only custom systems in that sector, or an empty array when none are configured.
     */
    private getCustomSystemsFromSector(sectorX: number, sectorY: number, sectorZ: number): StarSystemModel[] {
        const sectorKey = serializeStarSectorCoordinates(sectorX, sectorY, sectorZ);
        const systems = this.starSectorToCustomSystems.get(sectorKey);
        if (systems === undefined) {
            return [];
        }
        return systems;
    }

    private getCustomSystemFromCoordinates(coordinates: StarSystemCoordinates): StarSystemModel | undefined {
        return this.coordinatesToCustomSystems.get(serializeStarSystemCoordinates(coordinates));
    }

    /**
     * Check if a system is in the human bubble.
     * @param systemCoordinates - The coordinates of the system to check.
     * @returns true if the system is in the human bubble, false otherwise.
     */
    public isSystemInHumanBubble(systemCoordinates: StarSystemCoordinates): boolean {
        const systemPosition = this.getSystemGalacticPosition(systemCoordinates);
        const distanceToSolLy = Math.hypot(systemPosition.x, systemPosition.y, systemPosition.z);

        return distanceToSolLy < Settings.HUMAN_BUBBLE_RADIUS_LY;
    }

    public getSystemContentModelAt(coordinates: StarSystemCoordinates): DeepReadonly<StarSystemContentModel> | null {
        const system = this.getSystemModelAt(coordinates);
        if (system === null) {
            return null;
        }
        const entities = this.systemEntities.getModels(system);

        return { system, entities };
    }

    /**
     * Looks up a generated system model, including the configured fallback system.
     * @param coordinates - Sector and local coordinates identifying the star system.
     * @returns Read-only model when the coordinates are known, or `null` when no model exists.
     */
    private getSystemModelAt(coordinates: StarSystemCoordinates): DeepReadonly<StarSystemModel> | null {
        if (starSystemCoordinatesEquals(coordinates, this.fallbackSystem.coordinates)) {
            return this.fallbackSystem;
        }

        const customSystem = this.getCustomSystemFromCoordinates(coordinates);
        if (customSystem !== undefined) {
            return customSystem;
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

        return generateStarSystemModel(systemRng, coordinates);
    }

    private getGeneratedSystemCoordinatesInStarSector(
        sectorX: number,
        sectorY: number,
        sectorZ: number,
    ): {
        starSectorX: number;
        starSectorY: number;
        starSectorZ: number;
        localX: number;
        localY: number;
        localZ: number;
    }[] {
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
     * Builds coordinates for each generated system in the requested sector.
     * @param sectorX - The coordinate of the sector to query.
     * @param sectorY - The coordinate of the sector to query.
     * @param sectorZ - The coordinate of the sector to query.
     * @returns Generated coordinates, custom-system coordinates, then the fallback coordinates when present.
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
     * Retrieves generated and configured system models located in the requested sector.
     * @param sectorX - The coordinate of the sector to query.
     * @param sectorY - The coordinate of the sector to query.
     * @param sectorZ - The coordinate of the sector to query.
     * @returns Read-only system models, including the fallback system when it belongs to the sector.
     */
    getSystemModelsInStarSector(
        sectorX: number,
        sectorY: number,
        sectorZ: number,
    ): DeepReadonly<Array<StarSystemModel>> {
        const generatedModels: Array<DeepReadonly<StarSystemModel>> = [];

        const generatedSystemCoordinates = this.getGeneratedSystemCoordinatesInStarSector(sectorX, sectorY, sectorZ);

        for (const systemCoordinates of generatedSystemCoordinates) {
            const systemModel = this.getSystemModelAt(systemCoordinates);
            if (systemModel === null) {
                throw new Error("Generated system not found in the database!");
            }
            generatedModels.push(systemModel);
        }

        const customSystemModels: Array<DeepReadonly<StarSystemModel>> = [
            ...this.getCustomSystemsFromSector(sectorX, sectorY, sectorZ),
        ];

        if (
            this.fallbackSystem.coordinates.starSectorX === sectorX &&
            this.fallbackSystem.coordinates.starSectorY === sectorY &&
            this.fallbackSystem.coordinates.starSectorZ === sectorZ
        ) {
            customSystemModels.push(this.fallbackSystem);
        }

        return generatedModels.concat(customSystemModels);
    }

    /**
     * Reconstructs a star system's local coordinates from its sector and deterministic index.
     * @param starSectorX - The sector coordinate containing the star.
     * @param starSectorY - The sector coordinate containing the star.
     * @param starSectorZ - The sector coordinate containing the star.
     * @param index - Zero-based system index within the sector's generated sequence.
     * @returns Coordinates that identify the generated system in the universe grid.
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
     * Converts sector and local system coordinates to absolute galactic coordinates.
     * @param coordinates - Sector coordinates and local offset of the star system.
     * @returns Galactic position in the same distance units as `STAR_SECTOR_SIZE`.
     */
    public getSystemGalacticPosition(coordinates: StarSystemCoordinates): Vector3Like {
        return {
            x: (coordinates.starSectorX + coordinates.localX) * Settings.STAR_SECTOR_SIZE,
            y: (coordinates.starSectorY + coordinates.localY) * Settings.STAR_SECTOR_SIZE,
            z: (coordinates.starSectorZ + coordinates.localZ) * Settings.STAR_SECTOR_SIZE,
        };
    }

    /**
     * Generates deterministic local positions for procedurally placed stars in a sector.
     * @param sectorX - The coordinate of the sector to query.
     * @param sectorY - The coordinate of the sector to query.
     * @param sectorZ - The coordinate of the sector to query.
     * @returns Local offsets within the sector; positions are reproducible for the same sector and density.
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
     * Collects generated, fallback, and custom system offsets within a sector.
     * @param sectorX - The coordinate of the sector to query.
     * @param sectorY - The coordinate of the sector to query.
     * @param sectorZ - The coordinate of the sector to query.
     * @returns Local offsets in sector units, including configured non-generated systems.
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
     * Converts all generated and configured local system offsets to galactic positions.
     * @param sectorX - The coordinate of the sector to query.
     * @param sectorY - The coordinate of the sector to query.
     * @param sectorZ - The coordinate of the sector to query.
     * @returns Galactic positions scaled by `STAR_SECTOR_SIZE`.
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
     * @param universeObjectId - The id to look for
     * @returns The model if it exists, null otherwise.
     */
    public getObjectModel(universeObjectId: UniverseObjectId): DeepReadonly<UniverseObjectModel> | null {
        const starSystemCoordinates = universeObjectId.systemCoordinates;
        const starSystemModel = this.getSystemModelAt(starSystemCoordinates);
        if (starSystemModel === null) {
            return null;
        }

        const objectModel = getObjectModelById(universeObjectId.idInSystem, starSystemModel);
        if (objectModel !== null) {
            return {
                type: "orbitalObject",
                object: objectModel,
            };
        }

        const entities = this.systemEntities.getModels(starSystemModel);
        const foundEntity = entities.find((entity) => entity.id === universeObjectId.idInSystem);
        if (foundEntity !== undefined) {
            return {
                type: "systemEntity",
                object: foundEntity,
            };
        }

        return null;
    }
}
