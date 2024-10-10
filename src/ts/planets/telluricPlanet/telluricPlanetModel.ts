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

import { seededSquirrelNoise } from "squirrel-noise";
import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../../settings";
import { TerrainSettings } from "./terrain/terrainSettings";
import { clamp } from "terrain-generation";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { getOrbitalPeriod, getPeriapsis, Orbit } from "../../orbit/orbit";
import { isMoon, PlanetModel } from "../../architecture/planet";
import { TelluricPlanetPhysicalProperties } from "../../architecture/physicalProperties";
import { CelestialBodyModel, CelestialBodyType } from "../../architecture/celestialBody";
import { RingsModel } from "../../rings/ringsModel";
import { CloudsModel } from "../../clouds/cloudsModel";
import { GenerationSteps } from "../../utils/generationSteps";
import { getPlanetName } from "../common";
import { StarSystemModel } from "../../starSystem/starSystemModel";
import i18n from "../../i18n";
import { waterBoilingPointCelsius } from "../../utils/waterMechanics";

export class TelluricPlanetModel implements PlanetModel {
    readonly name: string;
    readonly bodyType = CelestialBodyType.TELLURIC_PLANET;

    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly orbit: Orbit;

    readonly physicalProperties: TelluricPlanetPhysicalProperties;

    readonly terrainSettings: TerrainSettings;

    readonly rings: RingsModel | null = null;
    readonly clouds: CloudsModel | null = null;

    readonly nbMoons: number;

    readonly parentBody: CelestialBodyModel | null;
    readonly childrenBodies: CelestialBodyModel[] = [];

    readonly typeName: string;

    constructor(seed: number, starSystemModel: StarSystemModel, parentBody?: CelestialBodyModel) {
        this.seed = seed;

        this.parentBody = parentBody ?? null;

        this.name = getPlanetName(this.seed, starSystemModel, this.parentBody);

        this.rng = seededSquirrelNoise(this.seed);

        const isSatelliteOfTelluric = this.parentBody?.bodyType === CelestialBodyType.TELLURIC_PLANET ?? false;
        const isSatelliteOfGas = this.parentBody?.bodyType === CelestialBodyType.GAS_PLANET ?? false;

        if (isSatelliteOfTelluric) {
            this.radius = Math.max(0.03, normalRandom(0.06, 0.03, this.rng, GenerationSteps.RADIUS)) * Settings.EARTH_RADIUS;
        } else if (isSatelliteOfGas) {
            this.radius = Math.max(0.03, normalRandom(0.25, 0.15, this.rng, GenerationSteps.RADIUS)) * Settings.EARTH_RADIUS;
        } else {
            this.radius = Math.max(0.3, normalRandom(1.0, 0.1, this.rng, GenerationSteps.RADIUS)) * Settings.EARTH_RADIUS;
        }

        //TODO: make mass dependent on more physical properties like density
        let mass;
        if (isSatelliteOfTelluric) {
            //FIXME: when Settings.Earth radius gets to 1:1 scale, change this value by a variable in settings
            mass = Settings.MOON_MASS * (this.radius / 1_735e3) ** 3;
        } else {
            //FIXME: when Settings.Earth radius gets to 1:1 scale, change this value by a variable in settings
            mass = Settings.EARTH_MASS * (this.radius / 6_371e3) ** 3;
        }

        const pressure = Math.max(normalRandom(0.9, 0.2, this.rng, GenerationSteps.PRESSURE), 0);

        //TODO: use distance to star to determine min temperature when using 1:1 scale
        const minTemperature = Math.max(-273, normalRandom(-20, 30, this.rng, 80));
        // when pressure is close to 1, the max temperature is close to the min temperature (the atmosphere does thermal regulation)
        const maxTemperature = minTemperature + Math.exp(-pressure) * randRangeInt(30, 200, this.rng, 81);

        this.physicalProperties = {
            mass: mass,
            axialTilt: normalRandom(0, 0.2, this.rng, GenerationSteps.AXIAL_TILT),
            rotationPeriod: (60 * 60 * 24) / 10,
            minTemperature: minTemperature,
            maxTemperature: maxTemperature,
            pressure: pressure,
            waterAmount: Math.max(normalRandom(1.0, 0.3, this.rng, GenerationSteps.WATER_AMOUNT), 0),
            oceanLevel: 0
        };

        const isOrbitalPlaneAlignedWithParent = isSatelliteOfGas && uniformRandBool(0.05, this.rng, GenerationSteps.ORBITAL_PLANE_ALIGNMENT);
        const orbitalPlaneNormal = isOrbitalPlaneAlignedWithParent
            ? Vector3.Up()
            : Vector3.Up().applyRotationQuaternionInPlace(Quaternion.RotationAxis(Axis.X, (this.rng(GenerationSteps.ORBIT + 20) - 0.5) * 0.2));

        // Todo: do not hardcode
        let orbitRadius = 2e9 + this.rng(GenerationSteps.ORBIT) * 15e9;

        const orbitalP = 2; //clamp(normalRandom(2.0, 0.3, this.rng, GenerationSteps.Orbit + 80), 0.7, 3.0);

        if (isSatelliteOfGas || isSatelliteOfTelluric) {
            const minRadius = this.parentBody?.radius ?? 0;
            orbitRadius = minRadius * clamp(normalRandom(2.0, 0.3, this.rng, GenerationSteps.ORBIT), 1.2, 3.0);
            orbitRadius += minRadius * clamp(normalRandom(10, 4, this.rng, GenerationSteps.ORBIT), 1, 50);
            orbitRadius += 2.0 * Math.max(0, minRadius - getPeriapsis(orbitRadius, orbitalP));
        } else if (parentBody) orbitRadius += parentBody.radius * 1.5;

        this.orbit = {
            radius: orbitRadius,
            p: orbitalP,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: orbitalPlaneNormal
        };

        if (isSatelliteOfTelluric || isSatelliteOfGas) {
            // Tidal locking for moons
            this.physicalProperties.rotationPeriod = this.orbit.period;
        }

        if (isSatelliteOfTelluric) {
            this.physicalProperties.pressure = Math.max(normalRandom(0.01, 0.01, this.rng, GenerationSteps.PRESSURE), 0);
        }
        if (this.radius <= 0.3 * Settings.EARTH_RADIUS) this.physicalProperties.pressure = 0;

        this.physicalProperties.oceanLevel = Settings.OCEAN_DEPTH * this.physicalProperties.waterAmount * this.physicalProperties.pressure;

        const waterBoilingPoint = waterBoilingPointCelsius(this.physicalProperties.pressure);
        const waterFreezingPoint = 0.0;
        const epsilon = 0.05;
        if (this.physicalProperties.pressure > epsilon) {
            // if temperature is too high, there is no ocean (desert world)
            if (this.physicalProperties.maxTemperature > waterBoilingPoint) this.physicalProperties.oceanLevel = 0;
            // if temperature is too low, there is no ocean (frozen world)
            if (this.physicalProperties.maxTemperature < waterFreezingPoint) this.physicalProperties.oceanLevel = 0;
        } else {
            // if pressure is too low, there is no ocean (sterile world)
            this.physicalProperties.oceanLevel = 0;
        }

        if (hasLiquidWater(this)) {
            this.clouds = new CloudsModel(
                this.radius + this.physicalProperties.oceanLevel,
                Settings.CLOUD_LAYER_HEIGHT,
                this.physicalProperties.waterAmount,
                this.physicalProperties.pressure
            );
        }

        this.terrainSettings = {
            continents_frequency: this.radius / Settings.EARTH_RADIUS,
            continents_fragmentation: clamp(normalRandom(0.65, 0.03, this.rng, GenerationSteps.TERRAIN), 0, 0.95),

            bumps_frequency: (30 * this.radius) / Settings.EARTH_RADIUS,

            max_bump_height: 1.5e3,
            max_mountain_height: 10e3,
            continent_base_height: this.physicalProperties.oceanLevel * 1.9,

            mountains_frequency: (60 * this.radius) / 1000e3
        };

        if (isSatelliteOfTelluric) {
            this.terrainSettings.continents_fragmentation = 0;
        }
        if (isSatelliteOfGas && this.physicalProperties.pressure === 0) {
            this.terrainSettings.continents_fragmentation = 0;
        }

        if (uniformRandBool(0.6, this.rng, GenerationSteps.RINGS) && !isSatelliteOfTelluric && !isSatelliteOfGas) {
            this.rings = new RingsModel(this.rng);
        }

        this.nbMoons = randRangeInt(0, 2, this.rng, GenerationSteps.NB_MOONS);

        this.typeName = isMoon(this) ? i18n.t("objectTypes:telluricMoon") : i18n.t("objectTypes:telluricPlanet");
    }
}

export function hasLiquidWater(telluricPlanetModel: TelluricPlanetModel): boolean {
    return telluricPlanetModel.physicalProperties.oceanLevel > 0;
}
