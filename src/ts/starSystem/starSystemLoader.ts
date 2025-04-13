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

import { Scene } from "@babylonjs/core/scene";
import { AnomalyModel, PlanetModel, StellarObjectModel } from "../architecture/orbitalObjectModel";
import { wait } from "../utils/wait";
import { StarSystemModel } from "./starSystemModel";
import { Anomaly, OrbitalFacility, Planet, StellarObject } from "../architecture/orbitalObject";
import { OrbitalObjectType } from "../architecture/orbitalObjectType";
import { Star } from "../stellarObjects/star/star";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { NeutronStar } from "../stellarObjects/neutronStar/neutronStar";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { EmptyCelestialBody } from "../utils/emptyCelestialBody";
import { SpaceStation } from "../spacestation/spaceStation";
import { SpaceElevator } from "../spacestation/spaceElevator";
import { TelluricPlanet } from "../planets/telluricPlanet/telluricPlanet";
import { GasPlanet } from "../planets/gasPlanet/gasPlanet";
import { TelluricSatelliteModel } from "../planets/telluricPlanet/telluricSatelliteModel";
import { DeepReadonly, isNonEmptyArray, NonEmptyArray } from "../utils/types";
import { getDistancesToStellarObjects } from "../utils/distanceToStellarObject";

export class StarSystemLoader {
    private loadingIndex: number;
    private maxLoadingIndex: number;

    private readonly offset = 1e8;
    private readonly timeOut = 500;

    constructor() {
        this.loadingIndex = 1;
        this.maxLoadingIndex = 1;
    }

    public getLoadingProgress(): number {
        return this.loadingIndex / this.maxLoadingIndex;
    }

    /**
     * Loads the star system from the underlying data model.
     * This instantiates all stars, planets, satellites, anomalies and space stations in the star system.
     */
    public async load(systemModel: DeepReadonly<StarSystemModel>, scene: Scene) {
        const numberOfObjects =
            systemModel.stellarObjects.length +
            systemModel.planets.length +
            systemModel.satellites.length +
            systemModel.orbitalFacilities.length;

        this.maxLoadingIndex = numberOfObjects;

        await wait(1000);

        const stellarObjects = await this.loadStellarObjects(systemModel.stellarObjects, scene);
        const planets = await this.loadPlanets(systemModel.planets, scene);
        const satellites = await this.loadSatellites(systemModel.satellites, scene);
        const anomalies = await this.loadAnomalies(systemModel.anomalies, scene);
        const orbitalFacilities = await this.loadOrbitalFacilities(systemModel, scene);

        await wait(1000);

        return {
            stellarObjects,
            planets,
            satellites,
            anomalies,
            orbitalFacilities
        };
    }

    private async loadStellarObjects(
        stellarObjectModels: DeepReadonly<Array<StellarObjectModel>>,
        scene: Scene
    ): Promise<Readonly<NonEmptyArray<StellarObject>>> {
        const stellarObjects: StellarObject[] = [];
        for (const stellarObjectModel of stellarObjectModels) {
            console.log("Loading stellar object:", stellarObjectModel.name);
            let stellarObject: StellarObject;
            switch (stellarObjectModel.type) {
                case OrbitalObjectType.STAR:
                    stellarObject = new Star(stellarObjectModel, scene);
                    break;
                case OrbitalObjectType.BLACK_HOLE:
                    stellarObject = new BlackHole(stellarObjectModel, scene);
                    break;
                case OrbitalObjectType.NEUTRON_STAR:
                    stellarObject = new NeutronStar(stellarObjectModel, scene);
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
        scene: Scene
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
            }
            anomalies.push(anomaly);

            anomaly.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            await wait(this.timeOut);
        }

        return anomalies;
    }

    private async loadOrbitalFacilities(
        systemModel: DeepReadonly<StarSystemModel>,
        scene: Scene
    ): Promise<ReadonlyArray<OrbitalFacility>> {
        const orbitalFacilities: OrbitalFacility[] = [];
        for (const orbitalFacilityModel of systemModel.orbitalFacilities) {
            const distancesToStellarObjects = getDistancesToStellarObjects(orbitalFacilityModel, systemModel);

            let orbitalFacility: OrbitalFacility;
            switch (orbitalFacilityModel.type) {
                case OrbitalObjectType.SPACE_STATION:
                    orbitalFacility = new SpaceStation(orbitalFacilityModel, distancesToStellarObjects, scene);
                    break;
                case OrbitalObjectType.SPACE_ELEVATOR:
                    orbitalFacility = new SpaceElevator(orbitalFacilityModel, distancesToStellarObjects, scene);
            }
            orbitalFacilities.push(orbitalFacility);
            orbitalFacility.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            await wait(this.timeOut);
        }

        return orbitalFacilities;
    }

    private async loadPlanets(
        planetModels: DeepReadonly<Array<PlanetModel>>,
        scene: Scene
    ): Promise<ReadonlyArray<Planet>> {
        const planets: Planet[] = [];
        for (const planetModel of planetModels) {
            console.log("Loading planet", planetModel.name);

            let planet: Planet;
            switch (planetModel.type) {
                case OrbitalObjectType.TELLURIC_PLANET:
                    planet = new TelluricPlanet(planetModel, scene);
                    break;
                case OrbitalObjectType.GAS_PLANET:
                    planet = new GasPlanet(planetModel, scene);
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
        scene: Scene
    ): Promise<ReadonlyArray<TelluricPlanet>> {
        const satellites: TelluricPlanet[] = [];
        for (const satelliteModel of satelliteModels) {
            console.log("Loading satellite:", satelliteModel.name);
            const satellite = new TelluricPlanet(satelliteModel, scene);
            satellite.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));
            satellites.push(satellite);

            await wait(this.timeOut);
        }

        return satellites;
    }
}
