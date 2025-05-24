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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { AnomalyModel, PlanetModel, StellarObjectModel } from "@/backend/universe/orbitalObjects/index";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { TelluricSatelliteModel } from "@/backend/universe/orbitalObjects/telluricSatelliteModel";
import { StarSystemModel } from "@/backend/universe/starSystemModel";

import { RenderingAssets } from "@/frontend/assets/renderingAssets";
import { GasPlanet } from "@/frontend/universe/planets/gasPlanet/gasPlanet";
import { TelluricPlanet } from "@/frontend/universe/planets/telluricPlanet/telluricPlanet";
import { BlackHole } from "@/frontend/universe/stellarObjects/blackHole/blackHole";
import { NeutronStar } from "@/frontend/universe/stellarObjects/neutronStar/neutronStar";
import { Star } from "@/frontend/universe/stellarObjects/star/star";

import { getDistancesToStellarObjects } from "@/utils/distanceToStellarObject";
import { DeepReadonly, isNonEmptyArray, NonEmptyArray } from "@/utils/types";
import { wait } from "@/utils/wait";

import { Anomaly, OrbitalFacility, Planet, StellarObject } from "./architecture/orbitalObject";
import { DarkKnight } from "./darkKnight";
import { EmptyCelestialBody } from "./emptyCelestialBody";
import { SpaceElevator } from "./orbitalFacility/spaceElevator";
import { SpaceStation } from "./orbitalFacility/spaceStation";

export class StarSystemLoader {
    private loadingIndex: number;
    private maxLoadingIndex: number;

    private readonly offset = 1e8;
    private readonly timeOut = 500;

    constructor() {
        this.loadingIndex = 0;
        this.maxLoadingIndex = 1;
    }

    public getLoadingProgress(): number {
        return this.loadingIndex / this.maxLoadingIndex;
    }

    /**
     * Loads the star system from the underlying data model.
     * This instantiates all stars, planets, satellites, anomalies and space stations in the star system.
     */
    public async load(systemModel: DeepReadonly<StarSystemModel>, assets: RenderingAssets, scene: Scene) {
        const numberOfObjects =
            systemModel.stellarObjects.length +
            systemModel.planets.length +
            systemModel.satellites.length +
            systemModel.anomalies.length +
            systemModel.orbitalFacilities.length;

        this.loadingIndex = 0;
        this.maxLoadingIndex = numberOfObjects;

        await wait(1000);

        const stellarObjects = await this.loadStellarObjects(systemModel.stellarObjects, assets, scene);
        const planets = await this.loadPlanets(systemModel.planets, assets, scene);
        const satellites = await this.loadSatellites(systemModel.satellites, assets, scene);
        const anomalies = await this.loadAnomalies(systemModel.anomalies, scene);
        const orbitalFacilities = await this.loadOrbitalFacilities(systemModel, assets, scene);

        await wait(1000);

        return {
            stellarObjects,
            planets,
            satellites,
            anomalies,
            orbitalFacilities,
        };
    }

    private async loadStellarObjects(
        stellarObjectModels: DeepReadonly<Array<StellarObjectModel>>,
        assets: RenderingAssets,
        scene: Scene,
    ): Promise<Readonly<NonEmptyArray<StellarObject>>> {
        const stellarObjects: StellarObject[] = [];
        for (const stellarObjectModel of stellarObjectModels) {
            console.log("Loading stellar object:", stellarObjectModel.name);
            let stellarObject: StellarObject;
            switch (stellarObjectModel.type) {
                case OrbitalObjectType.STAR:
                    stellarObject = new Star(stellarObjectModel, assets.textures.pools, scene);
                    break;
                case OrbitalObjectType.BLACK_HOLE:
                    stellarObject = new BlackHole(stellarObjectModel, assets.textures.environment.milkyWay, scene);
                    break;
                case OrbitalObjectType.NEUTRON_STAR:
                    stellarObject = new NeutronStar(stellarObjectModel, assets.textures.pools, scene);
                    break;
            }
            stellarObjects.push(stellarObject);

            stellarObject.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            await wait(this.timeOut);
        }

        if (!isNonEmptyArray(stellarObjects)) {
            throw new Error("No stellar objects found in the star system");
        }

        return stellarObjects;
    }

    private async loadAnomalies(
        anomalyModels: DeepReadonly<Array<AnomalyModel>>,
        scene: Scene,
    ): Promise<ReadonlyArray<Anomaly>> {
        const anomalies: Anomaly[] = [];
        for (const anomalyModel of anomalyModels) {
            console.log("Loading Anomaly:", anomalyModel.name);
            let anomaly: Anomaly;
            switch (anomalyModel.type) {
                case OrbitalObjectType.MANDELBULB:
                    anomaly = new EmptyCelestialBody(anomalyModel, scene);
                    break;
                case OrbitalObjectType.JULIA_SET:
                    anomaly = new EmptyCelestialBody(anomalyModel, scene);
                    break;
                case OrbitalObjectType.MANDELBOX:
                    anomaly = new EmptyCelestialBody(anomalyModel, scene);
                    break;
                case OrbitalObjectType.SIERPINSKI_PYRAMID:
                    anomaly = new EmptyCelestialBody(anomalyModel, scene);
                    break;
                case OrbitalObjectType.MENGER_SPONGE:
                    anomaly = new EmptyCelestialBody(anomalyModel, scene);
                    break;
                case OrbitalObjectType.DARK_KNIGHT:
                    anomaly = new DarkKnight(anomalyModel, scene);
                    break;
            }
            anomalies.push(anomaly);

            anomaly.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            await wait(this.timeOut);
        }

        return anomalies;
    }

    private async loadOrbitalFacilities(
        systemModel: DeepReadonly<StarSystemModel>,
        assets: RenderingAssets,
        scene: Scene,
    ): Promise<ReadonlyArray<OrbitalFacility>> {
        const orbitalFacilities: OrbitalFacility[] = [];
        for (const orbitalFacilityModel of systemModel.orbitalFacilities) {
            const distancesToStellarObjects = getDistancesToStellarObjects(orbitalFacilityModel, systemModel);

            let orbitalFacility: OrbitalFacility;
            switch (orbitalFacilityModel.type) {
                case OrbitalObjectType.SPACE_STATION:
                    orbitalFacility = new SpaceStation(orbitalFacilityModel, distancesToStellarObjects, assets, scene);
                    break;
                case OrbitalObjectType.SPACE_ELEVATOR:
                    orbitalFacility = new SpaceElevator(orbitalFacilityModel, distancesToStellarObjects, assets, scene);
            }
            orbitalFacilities.push(orbitalFacility);
            orbitalFacility.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            await wait(this.timeOut);
        }

        return orbitalFacilities;
    }

    private async loadPlanets(
        planetModels: DeepReadonly<Array<PlanetModel>>,
        assets: RenderingAssets,
        scene: Scene,
    ): Promise<ReadonlyArray<Planet>> {
        const planets: Planet[] = [];
        for (const planetModel of planetModels) {
            console.log("Loading planet", planetModel.name);

            let planet: Planet;
            switch (planetModel.type) {
                case OrbitalObjectType.TELLURIC_PLANET:
                    planet = new TelluricPlanet(planetModel, assets, scene);
                    break;
                case OrbitalObjectType.GAS_PLANET:
                    planet = new GasPlanet(planetModel, assets.textures, assets.textures.pools.ringsPatternLut, scene);
                    break;
            }

            planet.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            planets.push(planet);

            await wait(this.timeOut);
        }

        return planets;
    }

    private async loadSatellites(
        satelliteModels: DeepReadonly<Array<TelluricSatelliteModel>>,
        assets: RenderingAssets,
        scene: Scene,
    ): Promise<ReadonlyArray<TelluricPlanet>> {
        const satellites: TelluricPlanet[] = [];
        for (const satelliteModel of satelliteModels) {
            console.log("Loading satellite:", satelliteModel.name);
            const satellite = new TelluricPlanet(satelliteModel, assets, scene);
            satellite.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));
            satellites.push(satellite);

            await wait(this.timeOut);
        }

        return satellites;
    }
}
