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
import { StarSystemCoordinates, starSystemCoordinatesEquals } from "../utils/coordinates/universeCoordinates";
import { newSeededStarSystemModel } from "./seededStarSystemModel";
import { hashVec3 } from "../utils/hashVec3";
import { getRngFromSeed } from "../utils/getRngFromSeed";
import { Settings } from "../settings";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { centeredRand } from "extended-random";
import { SystemSeed } from "./systemSeed";
import { makeNoise3D } from "fast-simplex-noise/lib/3d";

export class StarSystemDatabase {
    private readonly starSectorToCustomSystems: Map<string, StarSystemModel[]> = new Map();
    private readonly coordinatesToCustomSystems: Map<string, StarSystemModel> = new Map();

    private readonly coordinatesToSinglePlugins: Map<string, (systemModel: StarSystemModel) => StarSystemModel> = new Map();

    private readonly generalPlugins: {
        predicate: (systemModel: StarSystemModel) => boolean;
        plugin: (systemModel: StarSystemModel) => StarSystemModel;
    }[] = [];

    private readonly universeDensity: (x: number, y: number, z: number) => number;

    constructor() {
        const densityRng = getRngFromSeed(Settings.UNIVERSE_SEED);
        let densitySampleStep = 0;
        const densityPerlin = makeNoise3D(() => {
            return densityRng(densitySampleStep++);
        });

        this.universeDensity = (x: number, y: number, z: number) => (1.0 - Math.abs(densityPerlin(x * 0.2, y * 0.2, z * 0.2))) ** 8;
    }

    private starSectorToString(sectorX: number, sectorY: number, sectorZ: number): string {
        return `${sectorX}|${sectorY}|${sectorZ}`;
    }

    public registerCustomSystem(system: StarSystemModel) {
        const sectorKey = this.starSectorToString(system.coordinates.starSectorX, system.coordinates.starSectorY, system.coordinates.starSectorZ);
        const systems = this.starSectorToCustomSystems.get(sectorKey);
        if (systems === undefined) {
            this.starSectorToCustomSystems.set(sectorKey, [system]);
        } else {
            systems.push(system);
        }

        this.coordinatesToCustomSystems.set(JSON.stringify(system.coordinates), system);
    }

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

    public registerSinglePlugin(coordinates: StarSystemCoordinates, plugin: (systemModel: StarSystemModel) => StarSystemModel) {
        this.coordinatesToSinglePlugins.set(JSON.stringify(coordinates), plugin);
    }

    public registerGeneralPlugin(predicate: (systemModel: StarSystemModel) => boolean, plugin: (systemModel: StarSystemModel) => StarSystemModel) {
        this.generalPlugins.push({ predicate, plugin });
    }

    public isSystemInHumanBubble(systemCoordinates: StarSystemCoordinates): boolean {
        const systemPosition = this.getSystemGalacticPosition(systemCoordinates);
        const distanceToSolLy = systemPosition.length();

        return distanceToSolLy < Settings.HUMAN_BUBBLE_RADIUS_LY;
    }

    public getSystemModelFromCoordinates(coordinates: StarSystemCoordinates) {
        const customSystem = this.getCustomSystemFromCoordinates(coordinates);
        if (customSystem !== undefined) {
            return this.applyPlugins(customSystem);
        }

        const seed = this.getSeedFromCoordinates(coordinates);
        if (seed === null) {
            throw new Error(`Seed not found for coordinates ${JSON.stringify(coordinates)}. It was not found in the custom system registry either.`);
        }

        return this.applyPlugins(newSeededStarSystemModel(seed, coordinates, this.getSystemGalacticPosition(coordinates), this.isSystemInHumanBubble(coordinates)));
    }

    public getSystemModelsInStarSector(sectorX: number, sectorY: number, sectorZ: number) {
        const generatedModels: StarSystemModel[] = [];

        const localPositions = this.getGeneratedLocalPositionsInStarSector(sectorX, sectorY, sectorZ);

        for (const localPosition of localPositions) {
            const systemCoordinates: StarSystemCoordinates = {
                starSectorX: sectorX,
                starSectorY: sectorY,
                starSectorZ: sectorZ,
                localX: localPosition.x,
                localY: localPosition.y,
                localZ: localPosition.z
            };

            const systemModel = this.getSystemModelFromCoordinates(systemCoordinates);
            generatedModels.push(systemModel);
        }

        const customSystemModels = this.getCustomSystemsFromSector(sectorX, sectorY, sectorZ);

        const allModels = generatedModels.concat(customSystemModels);

        return allModels.map((model) => {
            return this.applyPlugins(model);
        });
    }

    /**
     * From a system coordinates, try to find the seed of the system.
     * @param coordinates The coordinates of the system.
     * @returns The seed of the system, or null if not found.
     */
    public getSeedFromCoordinates(coordinates: StarSystemCoordinates): SystemSeed | null {
        const systemLocalPositions = this.getGeneratedLocalPositionsInStarSector(coordinates.starSectorX, coordinates.starSectorY, coordinates.starSectorZ);
        const indexOfSystem = systemLocalPositions.findIndex((localPosition) => {
            return localPosition.x === coordinates.localX && localPosition.y === coordinates.localY && localPosition.z === coordinates.localZ;
        });

        if (indexOfSystem === -1) {
            return null;
        }

        return {
            starSectorX: coordinates.starSectorX,
            starSectorY: coordinates.starSectorY,
            starSectorZ: coordinates.starSectorZ,
            index: indexOfSystem
        };
    }

    public getSystemCoordinatesFromSeed(systemSeed: SystemSeed): StarSystemCoordinates {
        const systemLocalPositions = this.getGeneratedLocalPositionsInStarSector(systemSeed.starSectorX, systemSeed.starSectorY, systemSeed.starSectorZ);
        const systemLocalPosition = systemLocalPositions.at(systemSeed.index);
        if (systemLocalPosition === undefined) {
            throw new Error(`Local position not found for seed ${JSON.stringify(systemSeed)}`);
        }

        return {
            starSectorX: systemSeed.starSectorX,
            starSectorY: systemSeed.starSectorY,
            starSectorZ: systemSeed.starSectorZ,
            localX: systemLocalPosition.x,
            localY: systemLocalPosition.y,
            localZ: systemLocalPosition.z
        };
    }

    public getSystemGalacticPosition(coordinates: StarSystemCoordinates) {
        return new Vector3(
            (coordinates.starSectorX + coordinates.localX) * Settings.STAR_SECTOR_SIZE,
            (coordinates.starSectorY + coordinates.localY) * Settings.STAR_SECTOR_SIZE,
            (coordinates.starSectorZ + coordinates.localZ) * Settings.STAR_SECTOR_SIZE
        );
    }

    private getGeneratedLocalPositionsInStarSector(sectorX: number, sectorY: number, sectorZ: number) {
        const rng = getRngFromSeed(hashVec3(sectorX, sectorY, sectorZ));

        const density = this.universeDensity(sectorX, sectorY, sectorZ);

        const nbGeneratedStars = 40 * density * rng(0);

        const localPositions: Vector3[] = [];

        for (let i = 0; i < nbGeneratedStars; i++) {
            const starLocalPosition = new Vector3(centeredRand(rng, 10 * i + 1) / 2, centeredRand(rng, 10 * i + 2) / 2, centeredRand(rng, 10 * i + 3) / 2);

            localPositions.push(starLocalPosition);
        }

        return localPositions;
    }

    public getSystemLocalPositionsInStarSector(sectorX: number, sectorY: number, sectorZ: number) {
        const localPositions: Vector3[] = [];

        localPositions.push(...this.getGeneratedLocalPositionsInStarSector(sectorX, sectorY, sectorZ));

        const customSystemModels = this.getCustomSystemsFromSector(sectorX, sectorY, sectorZ);

        for (const systemModel of customSystemModels) {
            localPositions.push(new Vector3(systemModel.coordinates.localX, systemModel.coordinates.localY, systemModel.coordinates.localZ));
        }

        return localPositions;
    }

    public getSystemPositionsInStarSector(sectorX: number, sectorY: number, sectorZ: number) {
        const localPositions = this.getSystemLocalPositionsInStarSector(sectorX, sectorY, sectorZ);

        const sectorPosition = new Vector3(sectorX, sectorY, sectorZ);

        return localPositions.map((localPosition) => {
            return localPosition.addInPlace(sectorPosition).scaleInPlace(Settings.STAR_SECTOR_SIZE);
        });
    }

    private applyPlugins(model: StarSystemModel): StarSystemModel {
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
