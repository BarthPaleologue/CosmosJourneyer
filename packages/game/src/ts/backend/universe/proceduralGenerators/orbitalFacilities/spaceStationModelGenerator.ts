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

import { normalRandom } from "extended-random";

import { getFactionFromCoordinates } from "@/backend/society/factions";
import { type CelestialBodyModel } from "@/backend/universe/orbitalObjects/index";
import { type Orbit } from "@/backend/universe/orbitalObjects/orbit";
import { type SpaceStationModel } from "@/backend/universe/orbitalObjects/orbitalFacilities/spacestationModel";

import { getDistancesToStellarObjects } from "@/frontend/helpers/distanceToStellarObject";

import { CropTypes, getEdibleEnergyPerAreaPerDay, type CropType } from "@/utils/agriculture";
import { GenerationSteps } from "@/utils/generationSteps";
import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { clamp } from "@/utils/math";
import { getSphereIrradianceAtDistance } from "@/utils/physics/thermodynamics";
import { degreesToRadians, km2ToM2, kwhPerYearToWatts } from "@/utils/physics/unitConversions";
import { randomPieChart, wheelOfFortune } from "@/utils/random";
import { getSolarPanelSurfaceFromEnergyRequirement } from "@/utils/solarPanels";
import { generateSpaceStationName } from "@/utils/strings/spaceStationNameGenerator";
import { assertUnreachable, type DeepPartial, type DeepReadonly } from "@/utils/types";

import { Settings } from "@/settings";

import type { StationSectionModel } from "../../orbitalObjects/orbitalFacilities/sections";
import type { StarSystemModel } from "../../starSystemModel";
import { generateCylinderHabitatModel } from "./sections/habitats/cylinder";
import { generateHelixHabitatModel } from "./sections/habitats/helix";
import { generateRingHabitatModel } from "./sections/habitats/ring";
import { generateUtilitySectionModel } from "./sections/utility";

export function generateSpaceStationModel(
    id: string,
    seed: number,
    parentBody: DeepReadonly<CelestialBodyModel>,
    systemModel: DeepReadonly<StarSystemModel>,
    overrides?: DeepPartial<SpaceStationModel>,
): SpaceStationModel {
    const rng = getRngFromSeed(seed);

    const name = overrides?.name ?? generateSpaceStationName(rng, 2756);

    let parentMaxRadius = parentBody.radius;
    if (parentBody.type === "blackHole") {
        parentMaxRadius += parentBody.accretionDiskRadius;
    }

    if (
        parentBody.type === "gasPlanet" ||
        parentBody.type === "telluricPlanet" ||
        parentBody.type === "star" ||
        parentBody.type === "neutronStar"
    ) {
        parentMaxRadius = parentBody.rings?.outerRadius ?? parentMaxRadius;
    }

    const orbitRadius = (2 + clamp(normalRandom(2, 1, rng, GenerationSteps.ORBIT), 0, 10)) * parentMaxRadius;

    const orbit: Orbit = {
        parentIds: [parentBody.id],
        semiMajorAxis: overrides?.orbit?.semiMajorAxis ?? orbitRadius,
        p: 2,
        inclination: degreesToRadians(normalRandom(0, 10, rng, GenerationSteps.ORBIT + 10)),
        eccentricity: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0,
    };

    const mass = 1;
    const siderealDaySeconds = 0;
    const axialTilt = 2 * rng(GenerationSteps.AXIAL_TILT) * Math.PI;

    const faction = overrides?.faction ?? getFactionFromCoordinates(systemModel.coordinates, rng);

    //TODO: make this dependent on economic model
    const population = 250_000 + Math.floor(rng(GenerationSteps.POPULATION) * 500_000);
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

    const sections: Array<StationSectionModel> = [];

    sections.push({ type: "engineBay" });

    const utilitySectionCount1 = 5 + Math.floor(rng(564) * 5);
    for (let i = 0; i < utilitySectionCount1; i++) {
        sections.push(generateUtilitySectionModel(Settings.SEED_HALF_RANGE * rng(132 + 10 * sections.length)));
    }

    let totalIrradiance = 0;
    if (parentBody.type === "star" || parentBody.type === "neutronStar" || parentBody.type === "blackHole") {
        totalIrradiance = getSphereIrradianceAtDistance(
            parentBody.blackBodyTemperature,
            parentBody.radius,
            orbit.semiMajorAxis,
        );
    } else {
        const distancesToStellarObjects = getDistancesToStellarObjects(parentBody, systemModel);

        for (const [model, distance] of distancesToStellarObjects) {
            totalIrradiance += getSphereIrradianceAtDistance(model.blackBodyTemperature, model.radius, distance);
        }
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

    const utilitySectionCount2 = 5 + Math.floor(rng(23) * 5);
    for (let i = 0; i < utilitySectionCount2; i++) {
        sections.push(generateUtilitySectionModel(Settings.SEED_HALF_RANGE * rng(132 + 10 * sections.length)));
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
            sections.push(
                generateRingHabitatModel(Settings.SEED_HALF_RANGE * rng(27), {
                    housing: housingSurface,
                    agriculture: agricultureSurface,
                }),
            );
            break;
        case "helix":
            sections.push(
                generateHelixHabitatModel(Settings.SEED_HALF_RANGE * rng(19), {
                    housing: housingSurface,
                    agriculture: agricultureSurface,
                }),
            );
            break;
        case "cylinder":
            sections.push(
                generateCylinderHabitatModel(Settings.SEED_HALF_RANGE * rng(13), {
                    housing: housingSurface,
                    agriculture: agricultureSurface,
                }),
            );
            break;
        default:
            return assertUnreachable(habitatType);
    }

    const utilitySectionCount3 = 5 + Math.floor(rng(23) * 5);
    for (let i = 0; i < utilitySectionCount3; i++) {
        sections.push(generateUtilitySectionModel(Settings.SEED_HALF_RANGE * rng(132 + 10 * sections.length)));
    }

    sections.push({ type: "landingBay" });

    return {
        type: "spaceStation",
        seed,
        starSystemCoordinates: systemModel.coordinates,
        id: id,
        name,
        orbit,
        mass,
        siderealDaySeconds,
        axialTilt,
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
