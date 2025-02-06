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

import { Vector3 } from "@babylonjs/core";
import { PlanetModel, StellarObjectModel } from "../architecture/orbitalObjectModel";
import { OrbitalObjectType } from "../architecture/orbitalObjectType";
import { Orbit } from "../orbit/orbit";
import { Settings } from "../settings";
import { getFactionFromGalacticPosition } from "../society/factions";
import { CropTypes, CropType, getEdibleEnergyPerHaPerDay } from "../utils/agriculture";
import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";
import { getRngFromSeed } from "../utils/getRngFromSeed";
import { getOrbitRadiusFromPeriod, getSphereRadiatedEnergyFlux } from "../utils/physics";
import { randomPieChart } from "../utils/random";
import { getSolarPanelSurfaceFromEnergyRequirement } from "../utils/solarPanels";
import { generateSpaceElevatorName } from "../utils/strings/spaceStationNameGenerator";
import { SpaceElevatorModel } from "./spaceElevatorModel";

export function newSeededSpaceElevatorModel(
    seed: number,
    stellarObjectModels: StellarObjectModel[],
    starSystemCoordinates: StarSystemCoordinates,
    starSystemPosition: Vector3,
    parentBody: PlanetModel
): SpaceElevatorModel {
    const rng = getRngFromSeed(seed);

    const name = generateSpaceElevatorName(rng, 2756);

    const parentSiderealDayDuration = parentBody.siderealDaySeconds;

    const orbitRadius = getOrbitRadiusFromPeriod(parentSiderealDayDuration, parentBody.mass);

    const orbit: Orbit = {
        semiMajorAxis: orbitRadius,
        p: 2,
        inclination: parentBody.orbit.inclination + parentBody.axialTilt,
        eccentricity: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0
    };

    const tetherLength = orbitRadius - parentBody.radius;

    const mass = 1;
    const siderealDaySeconds = parentSiderealDayDuration;
    const axialTilt = Math.PI / 2;

    const faction = getFactionFromGalacticPosition(starSystemPosition, rng);

    //TODO: make this dependent on economic model
    const population = 2_000_000;
    const energyConsumptionPerCapitaKWh = 40_000;

    const populationDensity = 4_000;

    const mix = randomPieChart(CropTypes.length, rng, 498);
    const agricultureMix: [number, CropType][] = mix.map((proportion, index) => [proportion, CropTypes[index]]);

    const nbHydroponicLayers = 10;

    // find average distance to stellar objects
    const distanceToStar = parentBody.orbit.semiMajorAxis;

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
        type: OrbitalObjectType.SPACE_ELEVATOR,
        starSystemCoordinates: starSystemCoordinates,
        name,
        orbit,
        mass,
        siderealDaySeconds,
        axialTilt,
        tetherLength,
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
