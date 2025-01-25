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

import { StellarObjectModel } from "../architecture/stellarObject";
import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";
import { CelestialBodyModel } from "../architecture/celestialBody";
import { getRngFromSeed } from "../utils/getRngFromSeed";
import { generateSpaceElevatorName } from "../utils/strings/spaceStationNameGenerator";
import { Orbit } from "../orbit/orbit";
import { OrbitalObjectPhysicsInfo } from "../architecture/physicsInfo";
import { getFactionFromGalacticPosition } from "../society/factions";
import { randomPieChart } from "../utils/random";
import { CropType, CropTypes, getEdibleEnergyPerHaPerDay } from "../utils/agriculture";
import { getOrbitRadiusFromPeriod, getSphereRadiatedEnergyFlux } from "../utils/physics";
import { getSolarPanelSurfaceFromEnergyRequirement } from "../utils/solarPanels";
import { Settings } from "../settings";
import { OrbitalObjectType } from "../architecture/orbitalObject";
import { OrbitalFacilityModel } from "./orbitalFacility";
import { Vector3 } from "@babylonjs/core/Maths/math";

export type SpaceElevatorModel = OrbitalFacilityModel & {
    readonly type: OrbitalObjectType.SPACE_ELEVATOR;

    readonly tetherLength: number;
};

export function newSeededSpaceElevatorModel(
    seed: number,
    stellarObjectModels: StellarObjectModel[],
    starSystemCoordinates: StarSystemCoordinates,
    starSystemPosition: Vector3,
    parentBody: CelestialBodyModel
): SpaceElevatorModel {
    const rng = getRngFromSeed(seed);

    const name = generateSpaceElevatorName(rng, 2756);

    const parentSiderealDayDuration = parentBody.physics.siderealDaySeconds;

    const orbitRadius = getOrbitRadiusFromPeriod(parentSiderealDayDuration, parentBody.physics.mass);

    const orbit: Orbit = {
        semiMajorAxis: orbitRadius,
        p: 2,
        inclination: 0,
        eccentricity: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0
    };

    const tetherLength = orbitRadius - parentBody.radius;

    const physicalProperties: OrbitalObjectPhysicsInfo = {
        mass: 1,
        siderealDaySeconds: parentSiderealDayDuration,
        axialTilt: Math.PI / 2
    };

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
        const starTemperature = stellarObject.physics.blackBodyTemperature;
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
        physics: physicalProperties,
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
