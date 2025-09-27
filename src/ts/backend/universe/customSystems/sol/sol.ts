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

import { type GasPlanetModel } from "@/backend/universe/orbitalObjects/gasPlanetModel";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { type TelluricPlanetModel } from "@/backend/universe/orbitalObjects/telluricPlanetModel";
import { type TelluricSatelliteModel } from "@/backend/universe/orbitalObjects/telluricSatelliteModel";
import { type StarSystemModel } from "@/backend/universe/starSystemModel";

import { barToPascal, degreesToRadians } from "@/utils/physics/unitConversions";

import { getEarthModel } from "./earth";
import { getJupiterModel } from "./jupiter";
import { getMarsModel } from "./mars";
import { getMercuryModel } from "./mercury";
import { getMoonModel } from "./moon";
import { getSaturnModel } from "./saturn";
import { getSunModel } from "./sun";

export function getSolSystemModel(): StarSystemModel {
    const sun = getSunModel();

    const mercury = getMercuryModel([sun.id]);

    const venus: TelluricPlanetModel = {
        id: "venus",
        name: "Venus",
        type: OrbitalObjectType.TELLURIC_PLANET,
        radius: 6_051.8e3,
        mass: 4.865e24,
        axialTilt: degreesToRadians(177.36),
        siderealDaySeconds: 60 * 60 * 24 * 243.025,
        waterAmount: 0,
        temperature: {
            min: 719,
            max: 763,
        },
        orbit: {
            parentIds: [sun.id],
            semiMajorAxis: 108_209_500e3,
            eccentricity: 0.0067,
            inclination: degreesToRadians(3.39),
            longitudeOfAscendingNode: degreesToRadians(76.68),
            argumentOfPeriapsis: degreesToRadians(54.88),
            initialMeanAnomaly: 0,
            p: 2,
        },
        terrainSettings: {
            continents_fragmentation: 0.1,
            continents_frequency: 1,

            bumps_frequency: 10,
            max_bump_height: 15e3,

            max_mountain_height: 20e3,
            continent_base_height: 0,

            mountains_frequency: 5,
        },
        rings: null,
        atmosphere: {
            seaLevelPressure: barToPascal(93),
            greenHouseEffectFactor: 0.99,
            gasMix: [
                ["CO2", 0.96],
                ["N2", 0.04],
            ],
            aerosols: {
                // see https://www.nasa.gov/wp-content/uploads/2019/04/niac_2019_phi_brandon_powerbeaming_tagged.pdf
                // see https://link.springer.com/article/10.1007/s11214-025-01176-4
                // see https://www.sciencedirect.com/science/article/abs/pii/S0019103511002624
                tau550: 30,
                angstromExponent: 0.1,
                particleRadius: 1e-6,
                settlingCoefficient: 0.3,
            },
        },
        clouds: {
            layerRadius: 6_051.8e3 + 10e3,
            smoothness: 0.7,
            specularPower: 2,
            frequency: 4,
            detailFrequency: 12,
            coverage: 0,
            sharpness: 2.5,
            color: { r: 0.8, g: 0.8, b: 0.1 },
            worleySpeed: 0.0005,
            detailSpeed: 0.003,
        },
        ocean: null,
        seed: 0,
    };

    const earth = getEarthModel([sun.id]);

    const moon: TelluricSatelliteModel = getMoonModel([earth.id]);

    const mars: TelluricPlanetModel = getMarsModel([sun.id]);

    const jupiter = getJupiterModel([sun.id]);

    const saturn = getSaturnModel([sun.id]);

    const uranus: GasPlanetModel = {
        id: "uranus",
        name: "Uranus",
        type: OrbitalObjectType.GAS_PLANET,
        radius: 25_362e3,
        mass: 8.681e25,
        axialTilt: degreesToRadians(97.77),
        siderealDaySeconds: 60 * 60 * 17.24,
        orbit: {
            parentIds: [sun.id],
            semiMajorAxis: 2_872_463_270e3,
            eccentricity: 0.0565,
            inclination: degreesToRadians(0.77),
            longitudeOfAscendingNode: degreesToRadians(74.229),
            argumentOfPeriapsis: degreesToRadians(96.541),
            initialMeanAnomaly: 0,
            p: 2,
        },
        colorPalette: {
            type: "textured",
            textureId: "uranus",
        },
        atmosphere: {
            seaLevelPressure: 100_000,
            greenHouseEffectFactor: 0.5,
            gasMix: [
                ["H2", 0.83],
                ["He", 0.15],
                ["CH4", 0.02],
            ],
            aerosols: {
                // see https://www.sciencedirect.com/science/article/abs/pii/0019103586901478
                // see https://www.ssec.wisc.edu/planetary/uranus/onlinedata/ura2012stis/ura_stis_analysis_supplement.pdf
                tau550: 0.08,
                angstromExponent: 0.9,
                particleRadius: 1e-7,
                settlingCoefficient: 1,
            },
        },
        rings: {
            innerRadius: 50_724e3,
            outerRadius: 62_000e3,
            type: "textured",
            textureId: "uranus",
        },
        seed: 0,
    };

    const neptune: GasPlanetModel = {
        id: "neptune",
        name: "Neptune",
        type: OrbitalObjectType.GAS_PLANET,
        radius: 24_622e3,
        mass: 1.024e26,
        axialTilt: degreesToRadians(28.32),
        siderealDaySeconds: 60 * 60 * 16.11,
        orbit: {
            parentIds: [sun.id],
            semiMajorAxis: 4_495_060_000e3,
            eccentricity: 0.0086,
            inclination: degreesToRadians(1.77),
            longitudeOfAscendingNode: degreesToRadians(131.72169),
            argumentOfPeriapsis: degreesToRadians(265.646853),
            initialMeanAnomaly: 0,
            p: 2,
        },
        colorPalette: {
            type: "textured",
            textureId: "neptune",
        },
        atmosphere: {
            seaLevelPressure: 100_000,
            greenHouseEffectFactor: 0.7,
            gasMix: [
                ["H2", 0.8],
                ["He", 0.19],
                ["CH4", 0.01],
            ],
            aerosols: {
                // see <https://www.researchgate.net/publication/341351962_Constraints_on_Neptune's_haze_structure_and_formation_from_VLT_observations_in_the_H-band>
                tau550: 0.5,
                angstromExponent: 1,
                particleRadius: 2.4e-7,
                settlingCoefficient: 1,
            },
        },
        rings: null,
        seed: 0,
    };

    return {
        name: "Sol",
        coordinates: {
            starSectorX: 0,
            starSectorY: 0,
            starSectorZ: 0,
            localX: 0,
            localY: 0,
            localZ: 0,
        },
        stellarObjects: [sun],
        planets: [mercury, venus, earth, mars, jupiter, saturn, uranus, neptune],
        satellites: [moon],
        anomalies: [],
        orbitalFacilities: [],
    };
}
