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

import { HydroponicToConventionalRatio, IndividualAverageDailyIntake, SeedHalfRange } from "#/constants";
import { getFactionFromCoordinates } from "#/society/factions";
import { CropTypes, getEdibleEnergyPerAreaPerDay, type CropType } from "#/utils/agriculture";
import { getDistancesToStellarObjects } from "#/utils/distanceToStellarObject";
import { getRngFromSeed } from "#/utils/getRngFromSeed";
import { randomPieChart, wheelOfFortune } from "#/utils/random";
import { generateSpaceElevatorName } from "#/utils/strings/spaceStationNameGenerator";
import {
    getOrbitRadiusFromPeriod,
    getSolarPanelSurfaceFromEnergyRequirement,
    getSphereIrradianceAtDistance,
    km2ToM2,
    kwhPerYearToWatts,
} from "@cosmos-journeyer/physics";
import { assertUnreachable, type DeepReadonly } from "@cosmos-journeyer/typescript";
import {
    getCelestialBodyRadius,
    type PlanetModel,
    type Orbit,
    type SpaceElevatorModel,
    type ElevatorSectionModel,
    type StarSystemModel,
    type Rotation,
} from "@cosmos-journeyer/universe-model";

import { generateFusionSectionModel } from "./sections/fusion";
import { generateCylinderHabitatModel } from "./sections/habitats/cylinder";
import { generateHelixHabitatModel } from "./sections/habitats/helix";
import { generateRingHabitatModel } from "./sections/habitats/ring";
import { generateLandingBayModel } from "./sections/landingBay";
import { generateSolarSectionModel } from "./sections/solar";
import { generateUtilitySectionModel } from "./sections/utility";

export function generateSpaceElevatorModel(
    id: string,
    seed: number,
    parentBody: DeepReadonly<PlanetModel>,
    systemModel: DeepReadonly<StarSystemModel>,
): SpaceElevatorModel {
    const rng = getRngFromSeed(seed);

    const name = generateSpaceElevatorName(rng, 2756);

    const parentSiderealDayDuration = parentBody.rotation.siderealPeriod;

    const orbitRadius = getOrbitRadiusFromPeriod(parentSiderealDayDuration, parentBody.mass);

    const orbit: Orbit = {
        parentIds: [parentBody.id],
        semiMajorAxis: orbitRadius,
        p: 2,
        inclination: parentBody.orbit.inclination + parentBody.rotation.axialTilt,
        eccentricity: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0,
    };

    const tetherLength = orbitRadius - parentBody.radius;

    const mass = 1;

    const rotation: Rotation = {
        siderealPeriod: parentSiderealDayDuration,
        axialTilt: Math.PI / 2,
        spinAxisAzimuth: 0,
        initialRotationAngle: 0,
    };

    const faction = getFactionFromCoordinates(systemModel.coordinates, rng);

    //TODO: make this dependent on economic model
    const population = 2_000_000;
    const annualEnergyPerCapitaKWh = 200_000; // US average is at 80k KWh https://www.eia.gov/tools/faqs/faq.php?id=85&t=1

    const targetPopulationDensity = 4_000;

    const mix = randomPieChart(CropTypes.length, rng, 498);
    const agricultureMix: [number, CropType][] = mix.map((proportion, index) => {
        const cropType = CropTypes[index];
        if (cropType === undefined) {
            throw new Error("CropTypes out of bound!");
        }
        return [proportion, cropType];
    });

    const nbHydroponicLayers = 10;

    const solarPanelEfficiency = 0.4;

    const sections: Array<ElevatorSectionModel> = [];

    const utilitySectionCount1 = 5 + Math.floor(rng(564) * 5);
    for (let i = 0; i < utilitySectionCount1; i++) {
        sections.push(generateUtilitySectionModel(SeedHalfRange * rng(132 + 10 * sections.length)));
    }

    const housingSurface = km2ToM2(population / targetPopulationDensity);
    let agricultureSurface = 0;
    for (const [fraction, cropType] of agricultureMix) {
        const requiredDailyKCal = population * IndividualAverageDailyIntake;

        const producedDailyKCalPerArea =
            HydroponicToConventionalRatio * nbHydroponicLayers * getEdibleEnergyPerAreaPerDay(cropType);

        const requiredArea = requiredDailyKCal / producedDailyKCalPerArea;

        agricultureSurface += fraction * requiredArea;
    }

    const habitatType = wheelOfFortune(
        [
            ["ring", 1 / 3],
            ["helix", 1 / 3],
            ["cylinder", 1 / 3],
        ] as const,
        rng(17),
    );

    switch (habitatType) {
        case "ring":
            sections.push(
                generateRingHabitatModel(SeedHalfRange * rng(27), {
                    housing: housingSurface,
                    agriculture: agricultureSurface,
                }),
            );
            break;
        case "helix":
            sections.push(
                generateHelixHabitatModel(SeedHalfRange * rng(19), {
                    housing: housingSurface,
                    agriculture: agricultureSurface,
                }),
            );
            break;
        case "cylinder":
            sections.push(
                generateCylinderHabitatModel(SeedHalfRange * rng(13), {
                    housing: housingSurface,
                    agriculture: agricultureSurface,
                }),
            );
            break;
        default:
            return assertUnreachable(habitatType);
    }

    const utilitySectionCount2 = 5 + Math.floor(rng(23) * 5);
    for (let i = 0; i < utilitySectionCount2; i++) {
        sections.push(generateUtilitySectionModel(SeedHalfRange * rng(132 + 10 * sections.length)));
    }

    const distancesToStellarObjects = getDistancesToStellarObjects(parentBody, systemModel);

    let totalIrradiance = 0;
    for (const [model, distance] of distancesToStellarObjects) {
        totalIrradiance += getSphereIrradianceAtDistance(
            model.blackBodyTemperature,
            getCelestialBodyRadius(model),
            distance,
        );
    }

    const totalEnergyRequirementKWhPerYear = population * annualEnergyPerCapitaKWh;
    const totalPowerRequirementW = kwhPerYearToWatts(totalEnergyRequirementKWhPerYear);
    const solarPanelSurfaceM2 = getSolarPanelSurfaceFromEnergyRequirement(
        solarPanelEfficiency,
        totalPowerRequirementW,
        totalIrradiance,
    );

    const maxSolarPanelSurfaceM2 = km2ToM2(150);
    if (solarPanelSurfaceM2 <= maxSolarPanelSurfaceM2) {
        sections.push(generateSolarSectionModel(SeedHalfRange * rng(31), solarPanelSurfaceM2));
    } else {
        sections.push(generateFusionSectionModel(totalPowerRequirementW));
    }

    const utilitySectionCount3 = 5 + Math.floor(rng(23) * 5);
    for (let i = 0; i < utilitySectionCount3; i++) {
        sections.push(generateUtilitySectionModel(SeedHalfRange * rng(132 + 10 * sections.length)));
    }

    sections.push(generateLandingBayModel(SeedHalfRange * rng(37)));

    return {
        type: "spaceElevator",
        seed,
        starSystemCoordinates: systemModel.coordinates,
        id: id,
        name,
        orbit,
        mass,
        rotation,
        tetherLength,
        population,
        annualEnergyPerCapitaKWh,
        populationDensity: targetPopulationDensity,
        agricultureMix,
        nbHydroponicLayers,
        faction,
        solarPanelEfficiency,
        sections,
    };
}
