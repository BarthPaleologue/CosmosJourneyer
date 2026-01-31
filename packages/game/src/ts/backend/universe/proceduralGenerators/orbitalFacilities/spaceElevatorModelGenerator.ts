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

import { getFactionFromCoordinates } from "@/backend/society/factions";
import { type PlanetModel } from "@/backend/universe/orbitalObjects/index";
import { type Orbit } from "@/backend/universe/orbitalObjects/orbit";
import { type SpaceElevatorModel } from "@/backend/universe/orbitalObjects/orbitalFacilities/spaceElevatorModel";

import { getDistancesToStellarObjects } from "@/frontend/helpers/distanceToStellarObject";

import { CropTypes, getEdibleEnergyPerAreaPerDay, type CropType } from "@/utils/agriculture";
import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { getOrbitRadiusFromPeriod } from "@/utils/physics/orbit";
import { getSphereIrradianceAtDistance } from "@/utils/physics/thermodynamics";
import { km2ToM2, kwhPerYearToWatts } from "@/utils/physics/unitConversions";
import { randomPieChart, wheelOfFortune } from "@/utils/random";
import { getSolarPanelSurfaceFromEnergyRequirement } from "@/utils/solarPanels";
import { generateSpaceElevatorName } from "@/utils/strings/spaceStationNameGenerator";
import { assertUnreachable, type DeepReadonly } from "@/utils/types";

import { Settings } from "@/settings";

import type { ElevatorSectionModel } from "../../orbitalObjects/orbitalFacilities/sections";
import type { StarSystemModel } from "../../starSystemModel";

export function newSeededSpaceElevatorModel(
    id: string,
    seed: number,
    parentBody: DeepReadonly<PlanetModel>,
    systemModel: DeepReadonly<StarSystemModel>,
): SpaceElevatorModel {
    const rng = getRngFromSeed(seed);

    const name = generateSpaceElevatorName(rng, 2756);

    const parentSiderealDayDuration = parentBody.siderealDaySeconds;

    const orbitRadius = getOrbitRadiusFromPeriod(parentSiderealDayDuration, parentBody.mass);

    const orbit: Orbit = {
        parentIds: [parentBody.id],
        semiMajorAxis: orbitRadius,
        p: 2,
        inclination: parentBody.orbit.inclination + parentBody.axialTilt,
        eccentricity: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0,
    };

    const tetherLength = orbitRadius - parentBody.radius;

    const mass = 1;
    const siderealDaySeconds = parentSiderealDayDuration;
    const axialTilt = Math.PI / 2;

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
        sections.push({ type: "utility" });
    }

    const housingSurface = km2ToM2(population / targetPopulationDensity);
    let agricultureSurface = 0;
    for (const [fraction, cropType] of agricultureMix) {
        const requiredDailyKCal = population * Settings.INDIVIDUAL_AVERAGE_DAILY_INTAKE;

        const producedDailyKCalPerArea =
            Settings.HYDROPONIC_TO_CONVENTIONAL_RATIO * nbHydroponicLayers * getEdibleEnergyPerAreaPerDay(cropType);

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
            sections.push({
                type: "ringHabitat",
                surface: {
                    housing: housingSurface,
                    agriculture: agricultureSurface,
                },
            });
            break;
        case "helix":
            sections.push({
                type: "helixHabitat",
                surface: {
                    housing: housingSurface,
                    agriculture: agricultureSurface,
                },
            });
            break;
        case "cylinder":
            sections.push({
                type: "cylinderHabitat",
                surface: {
                    housing: housingSurface,
                    agriculture: agricultureSurface,
                },
            });
            break;
        default:
            return assertUnreachable(habitatType);
    }

    const utilitySectionCount2 = 5 + Math.floor(rng(23) * 5);
    for (let i = 0; i < utilitySectionCount2; i++) {
        sections.push({ type: "utility" });
    }

    const distancesToStellarObjects = getDistancesToStellarObjects(parentBody, systemModel);

    let totalIrradiance = 0;
    for (const [model, distance] of distancesToStellarObjects) {
        totalIrradiance += getSphereIrradianceAtDistance(model.blackBodyTemperature, model.radius, distance);
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
        sections.push({ type: "solar", surface: solarPanelSurfaceM2 });
    } else {
        sections.push({ type: "fusion", netPowerOutput: totalPowerRequirementW });
    }

    const utilitySectionCount3 = 5 + Math.floor(rng(23) * 5);
    for (let i = 0; i < utilitySectionCount3; i++) {
        sections.push({ type: "utility" });
    }

    sections.push({ type: "landingBay" });

    return {
        type: "spaceElevator",
        seed,
        starSystemCoordinates: systemModel.coordinates,
        id: id,
        name,
        orbit,
        mass,
        siderealDaySeconds,
        axialTilt,
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
