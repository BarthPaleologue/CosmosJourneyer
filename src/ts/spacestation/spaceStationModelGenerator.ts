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

import { Vector3, Tools } from "@babylonjs/core";
import { normalRandom } from "extended-random";
import { clamp } from "../utils/math";
import { CelestialBodyModel, StellarObjectModel } from "../architecture/orbitalObjectModel";
import { OrbitalObjectType } from "../architecture/orbitalObjectType";
import { Orbit } from "../orbit/orbit";
import { Settings } from "../settings";
import { getFactionFromGalacticPosition } from "../society/factions";
import { CropTypes, CropType, getEdibleEnergyPerHaPerDay } from "../utils/agriculture";
import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";
import { GenerationSteps } from "../utils/generationSteps";
import { getRngFromSeed } from "../utils/getRngFromSeed";
import { getSphereRadiatedEnergyFlux } from "../utils/physics";
import { randomPieChart } from "../utils/random";
import { getSolarPanelSurfaceFromEnergyRequirement } from "../utils/solarPanels";
import { generateSpaceStationName } from "../utils/strings/spaceStationNameGenerator";
import { SpaceStationModel } from "./spacestationModel";

export function newSeededSpaceStationModel(
    seed: number,
    stellarObjectModels: StellarObjectModel[],
    starSystemCoordinates: StarSystemCoordinates,
    starSystemPosition: Vector3,
    parentBodies: CelestialBodyModel[]
): SpaceStationModel {
    const rng = getRngFromSeed(seed);

    const name = generateSpaceStationName(rng, 2756);

    const parentMaxRadius = parentBodies.reduce((max, body) => {
        let radius = body.radius;
        if (body.type === OrbitalObjectType.BLACK_HOLE) {
            radius += body.accretionDiskRadius;
        }

        if (
            body.type === OrbitalObjectType.GAS_PLANET ||
            body.type === OrbitalObjectType.TELLURIC_PLANET ||
            body.type === OrbitalObjectType.STAR ||
            body.type === OrbitalObjectType.NEUTRON_STAR
        ) {
            radius += (body.rings?.ringEnd ?? 0) * body.radius;
        }

        return radius;
    }, 0);
    const orbitRadius = (2 + clamp(normalRandom(2, 1, rng, GenerationSteps.ORBIT), 0, 10)) * parentMaxRadius;

    const orbit: Orbit = {
        semiMajorAxis: orbitRadius,
        p: 2,
        inclination: Tools.ToRadians(normalRandom(0, 10, rng, GenerationSteps.ORBIT + 10)),
        eccentricity: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0
    };

    const mass = 1;
    const siderealDaySeconds = 0;
    const axialTilt = 2 * rng(GenerationSteps.AXIAL_TILT) * Math.PI;

    const faction = getFactionFromGalacticPosition(starSystemPosition, rng);

    //TODO: make this dependent on economic model
    const population = 2_000_000;
    const energyConsumptionPerCapitaKWh = 40_000;

    const populationDensity = 4_000;

    const mix = randomPieChart(CropTypes.length, rng, 498);
    const agricultureMix: [number, CropType][] = mix.map((proportion, index) => [proportion, CropTypes[index]]);

    const nbHydroponicLayers = 10;

    // find average distance to stellar objects
    let distanceToStar = orbit.semiMajorAxis;
    parentBodies
        .filter(
            (body) =>
                body.type !== OrbitalObjectType.STAR &&
                body.type !== OrbitalObjectType.NEUTRON_STAR &&
                body.type !== OrbitalObjectType.BLACK_HOLE
        )
        .forEach((celestialBody) => {
            distanceToStar += celestialBody.orbit.semiMajorAxis;
        });
    distanceToStar /= parentBodies.length;

    let totalStellarFlux = 0;
    stellarObjectModels.forEach((stellarObject) => {
        const exposureTimeFraction = 0.5;
        const starRadius = stellarObject.radius;
        const starTemperature = stellarObject.blackBodyTemperature;
        totalStellarFlux +=
            getSphereRadiatedEnergyFlux(starTemperature, starRadius, distanceToStar) * exposureTimeFraction;
    });

    const totalEnergyConsumptionKWh = population * energyConsumptionPerCapitaKWh;

    const solarPanelEfficiency = 0.4;

    const solarPanelSurfaceM2 = getSolarPanelSurfaceFromEnergyRequirement(
        solarPanelEfficiency,
        totalEnergyConsumptionKWh,
        totalStellarFlux
    );

    const housingSurfaceHa = (100 * population) / populationDensity; // convert km² to ha
    let agricultureSurfaceHa = 0;
    agricultureMix.forEach(([fraction, cropType]) => {
        agricultureSurfaceHa +=
            (fraction * population * Settings.INDIVIDUAL_AVERAGE_DAILY_INTAKE) /
            (Settings.HYDROPONIC_TO_CONVENTIONAL_RATIO * nbHydroponicLayers * getEdibleEnergyPerHaPerDay(cropType));
    });
    const totalHabitatSurfaceM2 = (housingSurfaceHa + agricultureSurfaceHa) * 1000; // convert ha to m²

    return {
        seed,
        type: OrbitalObjectType.SPACE_STATION,
        starSystemCoordinates: starSystemCoordinates,
        name,
        orbit,
        mass,
        siderealDaySeconds,
        axialTilt,
        population,
        energyConsumptionPerCapitaKWh,
        populationDensity,
        agricultureMix,
        nbHydroponicLayers,
        faction,
        totalEnergyConsumptionKWh,
        solarPanelEfficiency,
        solarPanelSurfaceM2,
        housingSurfaceHa,
        agricultureSurfaceHa,
        totalHabitatSurfaceM2
    };
}
