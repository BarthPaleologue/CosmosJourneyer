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

import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import { OrbitalObjectType } from "../../architecture/orbitalObject";
import { StarModel } from "../../stellarObjects/star/starModel";
import { StarSystemModel } from "../starSystemModel";
import { TelluricPlanetModel } from "../../planets/telluricPlanet/telluricPlanetModel";
import { Settings } from "../../settings";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { celsiusToKelvin } from "../../utils/physics";
import { TelluricSatelliteModel } from "../../planets/telluricPlanet/telluricSatelliteModel";

export function getSolSystemModel(): StarSystemModel {
    const sun: StarModel = {
        name: "Sun",
        type: OrbitalObjectType.STAR,
        radius: 695_508e3,
        physics: {
            mass: 1.989e30,
            blackBodyTemperature: 5778,
            axialTilt: Quaternion.Identity(),
            siderealDaySeconds: 60 * 60 * 24 * 25.67
        },
        orbit: {
            radius: 0,
            period: 0,
            p: 2,
            orientation: Quaternion.Identity()
        },
        rings: null,
        seed: 0
    };

    const mercury: TelluricPlanetModel = {
        name: "Mercury",
        type: OrbitalObjectType.TELLURIC_PLANET,
        radius: 2_439.7e3,
        physics: {
            mass: 3.301e23,
            axialTilt: Quaternion.Identity(),
            siderealDaySeconds: 60 * 60 * 24 * 58.646,
            oceanLevel: 0,
            waterAmount: 0,
            pressure: 0,
            minTemperature: 437,
            maxTemperature: 437
        },
        orbit: {
            radius: 0.38 * Settings.AU,
            period: 60 * 60 * 24 * 87.9691,
            p: 2,
            orientation: Quaternion.Identity()
        },
        terrainSettings: {
            continents_fragmentation: 0.1,
            continents_frequency: 1,

            bumps_frequency: 10,
            max_bump_height: 15e3,

            max_mountain_height: 0e3,
            continent_base_height: 0,

            mountains_frequency: 0
        },
        rings: null,
        clouds: null,
        seed: 0
    };

    const venus: TelluricPlanetModel = {
        name: "Venus",
        type: OrbitalObjectType.TELLURIC_PLANET,
        radius: 6_051.8e3,
        physics: {
            mass: 4.8e20,
            axialTilt: Quaternion.Identity(),
            siderealDaySeconds: 60 * 60 * 24 * 243.025,
            oceanLevel: 0,
            waterAmount: 0,
            pressure: 93 * Settings.BAR_TO_PASCAL,
            minTemperature: 719,
            maxTemperature: 763
        },
        orbit: {
            radius: 108_209_500e3,
            orientation: Quaternion.Identity(),
            period: 224.701 * 24 * 60 * 60,
            p: 2
        },
        terrainSettings: {
            continents_fragmentation: 0.1,
            continents_frequency: 1,

            bumps_frequency: 10,
            max_bump_height: 15e3,

            max_mountain_height: 20e3,
            continent_base_height: 0,

            mountains_frequency: 5
        },
        rings: null,
        clouds: {
            layerRadius: 6_051.8e3 + 10e3,
            smoothness: 0.7,
            specularPower: 2,
            frequency: 4,
            detailFrequency: 12,
            coverage: 0,
            sharpness: 2.5,
            color: new Color3(0.8, 0.8, 0.1),
            worleySpeed: 0.0005,
            detailSpeed: 0.003
        },
        seed: 0
    };

    const earth: TelluricPlanetModel = {
        name: "Earth",
        type: OrbitalObjectType.TELLURIC_PLANET,
        radius: 6_371e3,
        physics: {
            mass: 5.972e24,
            axialTilt: Quaternion.Identity(),
            siderealDaySeconds: 60 * 60 * 24,
            oceanLevel: 10e3,
            waterAmount: 1,
            pressure: 1 * Settings.BAR_TO_PASCAL,
            minTemperature: celsiusToKelvin(-50),
            maxTemperature: celsiusToKelvin(50)
        },
        orbit: {
            radius: 149_597_870e3,
            orientation: Quaternion.Identity(),
            period: 365.25 * 24 * 60 * 60,
            p: 2
        },
        terrainSettings: {
            continents_frequency: 1,
            continents_fragmentation: 0.65,

            bumps_frequency: 30,

            max_bump_height: 1.5e3,
            max_mountain_height: 10e3,
            continent_base_height: 10e3 * 1.9,

            mountains_frequency: 360
        },
        rings: null,
        clouds: {
            layerRadius: 6_371e3 + 30e3,
            smoothness: 0.7,
            specularPower: 2,
            frequency: 4,
            detailFrequency: 12,
            coverage: 0.5,
            sharpness: 2.5,
            color: new Color3(0.8, 0.8, 0.8),
            worleySpeed: 0.0005,
            detailSpeed: 0.003
        },
        seed: 0
    };

    const moon: TelluricSatelliteModel = {
        name: "Moon",
        type: OrbitalObjectType.TELLURIC_SATELLITE,
        radius: 1_737.1e3,
        physics: {
            mass: 7.342e22,
            axialTilt: Quaternion.Identity(),
            siderealDaySeconds: 60 * 60 * 24 * 27.322,
            oceanLevel: 0,
            waterAmount: 0,
            pressure: 0,
            minTemperature: 100,
            maxTemperature: 100
        },
        orbit: {
            radius: 384_400e3,
            period: 60 * 60 * 24 * 27.322,
            p: 2,
            orientation: Quaternion.Identity()
        },
        terrainSettings: {
            continents_fragmentation: 0.1,
            continents_frequency: 1,

            bumps_frequency: 10,
            max_bump_height: 15e3,

            max_mountain_height: 0e3,
            continent_base_height: 0,

            mountains_frequency: 0
        },
        rings: null,
        clouds: null,
        seed: 0
    };

    const mars: TelluricPlanetModel = {
        name: "Mars",
        type: OrbitalObjectType.TELLURIC_PLANET,
        radius: 3_389.5e3,
        physics: {
            mass: 6.4171e23,
            axialTilt: Quaternion.Identity(),
            siderealDaySeconds: 60 * 60 * 24 * 1.027,
            oceanLevel: 0,
            waterAmount: 0,
            pressure: 0.006 * Settings.BAR_TO_PASCAL,
            minTemperature: celsiusToKelvin(-140),
            maxTemperature: celsiusToKelvin(20)
        },
        orbit: {
            radius: 227_939_200e3,
            period: 60 * 60 * 24 * 687,
            p: 2,
            orientation: Quaternion.Identity()
        },
        terrainSettings: {
            continents_fragmentation: 0.1,
            continents_frequency: 1,

            bumps_frequency: 10,
            max_bump_height: 15e3,

            max_mountain_height: 0e3,
            continent_base_height: 0,

            mountains_frequency: 0
        },
        rings: null,
        clouds: null,
        seed: 0
    };

    const jupiter: TelluricPlanetModel = {
        name: "Jupiter",
        type: OrbitalObjectType.TELLURIC_PLANET,
        radius: 69_911e3,
        physics: {
            mass: 1.898e27,
            axialTilt: Quaternion.Identity(),
            siderealDaySeconds: 60 * 60 * 9.925,
            oceanLevel: 0,
            waterAmount: 0,
            pressure: 0.1 * Settings.BAR_TO_PASCAL,
            minTemperature: celsiusToKelvin(-145),
            maxTemperature: celsiusToKelvin(-145)
        },
        orbit: {
            radius: 778_547_200e3,
            period: 60 * 60 * 24 * 4_332,
            p: 2,
            orientation: Quaternion.Identity()
        },
        terrainSettings: {
            continents_fragmentation: 0.1,
            continents_frequency: 1,

            bumps_frequency: 10,
            max_bump_height: 15e3,

            max_mountain_height: 0e3,
            continent_base_height: 0,

            mountains_frequency: 0
        },
        rings: null,
        clouds: null,
        seed: 0
    };

    const saturn: TelluricPlanetModel = {
        name: "Saturn",
        type: OrbitalObjectType.TELLURIC_PLANET,
        radius: 58_232e3,
        physics: {
            mass: 5.683e26,
            axialTilt: Quaternion.Identity(),
            siderealDaySeconds: 60 * 60 * 10.656,
            oceanLevel: 0,
            waterAmount: 0,
            pressure: 0.1 * Settings.BAR_TO_PASCAL,
            minTemperature: celsiusToKelvin(-178),
            maxTemperature: celsiusToKelvin(-178)
        },
        orbit: {
            radius: 1_433_449_370e3,
            period: 60 * 60 * 24 * 10_759,
            p: 2,
            orientation: Quaternion.Identity()
        },
        terrainSettings: {
            continents_fragmentation: 0.1,
            continents_frequency: 1,

            bumps_frequency: 10,
            max_bump_height: 15e3,

            max_mountain_height: 0e3,
            continent_base_height: 0,

            mountains_frequency: 0
        },
        rings: {
            seed: 0,
            ringStart: 1.2,
            ringEnd: 2.27,
            ringColor: new Color3(0.8, 0.8, 0.8),
            ringOpacity: 0.5,
            ringFrequency: 2
        },
        clouds: null,
        seed: 0
    };

    const uranus: TelluricPlanetModel = {
        name: "Uranus",
        type: OrbitalObjectType.TELLURIC_PLANET,
        radius: 25_362e3,
        physics: {
            mass: 8.681e25,
            axialTilt: Quaternion.Identity(),
            siderealDaySeconds: 60 * 60 * 17.24,
            oceanLevel: 0,
            waterAmount: 0,
            pressure: 0.1 * Settings.BAR_TO_PASCAL,
            minTemperature: celsiusToKelvin(-224),
            maxTemperature: celsiusToKelvin(-224)
        },
        orbit: {
            radius: 2_872_463_270e3,
            period: 60 * 60 * 24 * 30_687,
            p: 2,
            orientation: Quaternion.Identity()
        },
        terrainSettings: {
            continents_fragmentation: 0.1,
            continents_frequency: 1,

            bumps_frequency: 10,
            max_bump_height: 15e3,

            max_mountain_height: 0e3,
            continent_base_height: 0,

            mountains_frequency: 0
        },
        rings: null,
        clouds: null,
        seed: 0
    };

    const neptune: TelluricPlanetModel = {
        name: "Neptune",
        type: OrbitalObjectType.TELLURIC_PLANET,
        radius: 24_622e3,
        physics: {
            mass: 1.024e26,
            axialTilt: Quaternion.Identity(),
            siderealDaySeconds: 60 * 60 * 16.11,
            oceanLevel: 0,
            waterAmount: 0,
            pressure: 0.1 * Settings.BAR_TO_PASCAL,
            minTemperature: celsiusToKelvin(-214),
            maxTemperature: celsiusToKelvin(-214)
        },
        orbit: {
            radius: 4_495_060_000e3,
            period: 60 * 60 * 24 * 60_190,
            p: 2,
            orientation: Quaternion.Identity()
        },
        terrainSettings: {
            continents_fragmentation: 0.1,
            continents_frequency: 1,

            bumps_frequency: 10,
            max_bump_height: 15e3,

            max_mountain_height: 0e3,
            continent_base_height: 0,

            mountains_frequency: 0
        },
        rings: null,
        clouds: null,
        seed: 0
    };

    return {
        name: "Sol",
        coordinates: {
            starSectorX: 0,
            starSectorY: 0,
            starSectorZ: 0,
            localX: 0,
            localY: 0,
            localZ: 0
        },
        subSystems: [
            {
                stellarObjects: [sun],
                planetarySystems: [
                    {
                        planets: [mercury],
                        satellites: [],
                        orbitalFacilities: []
                    },
                    {
                        planets: [venus],
                        satellites: [],
                        orbitalFacilities: []
                    },
                    {
                        planets: [earth],
                        satellites: [moon],
                        orbitalFacilities: []
                    },
                    {
                        planets: [mars],
                        satellites: [],
                        orbitalFacilities: []
                    },
                    {
                        planets: [jupiter],
                        satellites: [],
                        orbitalFacilities: []
                    },
                    {
                        planets: [saturn],
                        satellites: [],
                        orbitalFacilities: []
                    },
                    {
                        planets: [uranus],
                        satellites: [],
                        orbitalFacilities: []
                    },
                    {
                        planets: [neptune],
                        satellites: [],
                        orbitalFacilities: []
                    }
                ],
                anomalies: [],
                orbitalFacilities: []
            }
        ]
    };
}
