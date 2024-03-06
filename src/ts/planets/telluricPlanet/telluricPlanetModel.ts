//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { seededSquirrelNoise } from "squirrel-noise";
import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../../settings";
import { BodyType, GenerationSteps } from "../../model/common";
import { TerrainSettings } from "./terrain/terrainSettings";
import { clamp } from "terrain-generation";
import { RingsUniforms } from "../../postProcesses/rings/ringsUniform";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { getOrbitalPeriod, getPeriapsis } from "../../orbit/orbit";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { CloudsUniforms } from "../../postProcesses/clouds/cloudsUniforms";
import { PlanetModel } from "../../architecture/planet";
import { TelluricPlanetPhysicalProperties } from "../../architecture/physicalProperties";
import { CelestialBodyModel } from "../../architecture/celestialBody";

export class TelluricPlanetModel implements PlanetModel {
    readonly bodyType = BodyType.TELLURIC_PLANET;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly orbit: OrbitProperties;

    readonly physicalProperties: TelluricPlanetPhysicalProperties;

    readonly terrainSettings: TerrainSettings;

    ringsUniforms: RingsUniforms | null = null;
    cloudsUniforms: CloudsUniforms | null = null;

    readonly nbMoons: number;

    private isSatelliteOfTelluric = false;
    private isSatelliteOfGas = false;

    readonly parentBody: CelestialBodyModel | null;
    readonly childrenBodies: CelestialBodyModel[] = [];

    constructor(seed: number, parentBody?: CelestialBodyModel) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.parentBody = parentBody ?? null;

        if (this.parentBody?.bodyType === BodyType.TELLURIC_PLANET) this.isSatelliteOfTelluric = true;
        if (this.parentBody?.bodyType === BodyType.GAS_PLANET) this.isSatelliteOfGas = true;

        if (this.isSatelliteOfTelluric) {
            this.radius = Math.max(0.03, normalRandom(0.06, 0.03, this.rng, GenerationSteps.RADIUS)) * Settings.EARTH_RADIUS;
        } else if (this.isSatelliteOfGas) {
            this.radius = Math.max(0.03, normalRandom(0.25, 0.15, this.rng, GenerationSteps.RADIUS)) * Settings.EARTH_RADIUS;
        } else {
            this.radius = Math.max(0.3, normalRandom(1.0, 0.1, this.rng, GenerationSteps.RADIUS)) * Settings.EARTH_RADIUS;
        }

        const mass = this.isSatelliteOfTelluric ? 1 : 10;

        this.physicalProperties = {
            mass: mass,
            axialTilt: normalRandom(0, 0.2, this.rng, GenerationSteps.AXIAL_TILT),
            rotationPeriod: (60 * 60 * 24) / 10,
            minTemperature: randRangeInt(-60, 5, this.rng, 80),
            maxTemperature: randRangeInt(10, 50, this.rng, 81),
            pressure: Math.max(normalRandom(0.9, 0.2, this.rng, GenerationSteps.PRESSURE), 0),
            waterAmount: Math.max(normalRandom(1.0, 0.3, this.rng, GenerationSteps.WATER_AMOUNT), 0),
            oceanLevel: 0
        };

        const isOrbitalPlaneAlignedWithParent = this.isSatelliteOfGas && uniformRandBool(0.05, this.rng, GenerationSteps.ORBITAL_PLANE_ALIGNMENT);
        const orbitalPlaneNormal = isOrbitalPlaneAlignedWithParent
            ? Vector3.Up()
            : Vector3.Up().applyRotationQuaternionInPlace(Quaternion.RotationAxis(Axis.X, (this.rng(GenerationSteps.ORBIT + 20) - 0.5) * 0.2));

        // Todo: do not hardcode
        let orbitRadius = 2e9 + this.rng(GenerationSteps.ORBIT) * 15e9;

        const orbitalP = 2; //clamp(normalRandom(2.0, 0.3, this.rng, GenerationSteps.Orbit + 80), 0.7, 3.0);

        if (this.isSatelliteOfGas || this.isSatelliteOfTelluric) {
            const minRadius = this.parentBody?.radius ?? 0;
            orbitRadius = minRadius * clamp(normalRandom(2.0, 0.3, this.rng, GenerationSteps.ORBIT), 1.2, 3.0);
            orbitRadius += minRadius * clamp(normalRandom(10, 4, this.rng, GenerationSteps.ORBIT), 1, 50);
            orbitRadius += 2.0 * Math.max(0, minRadius - getPeriapsis(orbitRadius, orbitalP));
        } else if (parentBody) orbitRadius += parentBody.radius * 1.5;

        this.orbit = {
            radius: orbitRadius,
            p: orbitalP,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: orbitalPlaneNormal,
            isPlaneAlignedWithParent: isOrbitalPlaneAlignedWithParent
        };

        if (this.isSatelliteOfTelluric || this.isSatelliteOfGas) {
            // Tidal locking for moons
            this.physicalProperties.rotationPeriod = this.orbit.period;
        }

        if (this.isSatelliteOfTelluric) {
            this.physicalProperties.pressure = Math.max(normalRandom(0.01, 0.01, this.rng, GenerationSteps.PRESSURE), 0);
        }
        if (this.radius <= 0.3 * Settings.EARTH_RADIUS) this.physicalProperties.pressure = 0;

        this.physicalProperties.oceanLevel = Settings.OCEAN_DEPTH * this.physicalProperties.waterAmount * this.physicalProperties.pressure;

        this.terrainSettings = {
            continents_frequency: this.radius / Settings.EARTH_RADIUS,
            continents_fragmentation: clamp(normalRandom(0.65, 0.03, this.rng, GenerationSteps.TERRAIN), 0, 0.95),

            bumps_frequency: (30 * this.radius) / Settings.EARTH_RADIUS,

            max_bump_height: 1.5e3,
            max_mountain_height: 10e3,
            continent_base_height: this.physicalProperties.oceanLevel * 1.9,

            mountains_frequency: (60 * this.radius) / 1000e3
        };

        if (this.isSatelliteOfTelluric) {
            this.terrainSettings.continents_fragmentation = 0;
        }
        if (this.isSatelliteOfGas && this.physicalProperties.pressure === 0) {
            this.terrainSettings.continents_fragmentation = 0;
        }

        if (uniformRandBool(0.6, this.rng, GenerationSteps.RINGS) && !this.isSatelliteOfTelluric && !this.isSatelliteOfGas) {
            this.ringsUniforms = new RingsUniforms(this.rng);
        }

        const waterFreezingPoint = 0.0;
        if (waterFreezingPoint > this.physicalProperties.minTemperature && waterFreezingPoint < this.physicalProperties.maxTemperature && this.physicalProperties.pressure > 0) {
            this.cloudsUniforms = new CloudsUniforms(this.getApparentRadius(), Settings.CLOUD_LAYER_HEIGHT, this.physicalProperties.waterAmount, this.physicalProperties.pressure);
        }

        this.nbMoons = randRangeInt(0, 2, this.rng, GenerationSteps.NB_MOONS);
    }

    getApparentRadius(): number {
        return this.radius + this.physicalProperties.oceanLevel;
    }

    public getNbSpaceStations(): number {
        if (uniformRandBool(0.2, this.rng, GenerationSteps.SPACE_STATION)) return 1;
        if (uniformRandBool(0.1, this.rng, GenerationSteps.SPACE_STATION + 10)) return 2;
        return 0;
    }
}
