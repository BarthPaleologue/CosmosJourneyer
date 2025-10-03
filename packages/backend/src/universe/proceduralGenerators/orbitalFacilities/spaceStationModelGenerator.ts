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

import { getFactionFromGalacticPosition } from "@cosmos-journeyer/backend/society/factions";
import { type CelestialBodyModel } from "@cosmos-journeyer/backend/universe/orbitalObjects/index";
import { type Orbit } from "@cosmos-journeyer/backend/universe/orbitalObjects/orbit";
import { type SpaceStationModel } from "@cosmos-journeyer/backend/universe/orbitalObjects/orbitalFacilities/spacestationModel";
import { OrbitalObjectType } from "@cosmos-journeyer/backend/universe/orbitalObjects/orbitalObjectType";
import { type StarSystemCoordinates } from "@cosmos-journeyer/backend/universe/starSystemCoordinates";
import { CropTypes, type CropType } from "@cosmos-journeyer/utils/agriculture";
import { GenerationSteps } from "@cosmos-journeyer/utils/generationSteps";
import { getRngFromSeed } from "@cosmos-journeyer/utils/getRngFromSeed";
import { clamp } from "@cosmos-journeyer/utils/math";
import { degreesToRadians } from "@cosmos-journeyer/utils/physics/unitConversions";
import { randomPieChart } from "@cosmos-journeyer/utils/random";
import { generateSpaceStationName } from "@cosmos-journeyer/utils/strings/spaceStationNameGenerator";
import type { Vector3Like } from "@cosmos-journeyer/utils/types";
import { normalRandom } from "extended-random";

export function newSeededSpaceStationModel(
    id: string,
    seed: number,
    starSystemCoordinates: StarSystemCoordinates,
    starSystemPosition: Vector3Like,
    parentBodies: CelestialBodyModel[],
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
            radius = body.rings?.outerRadius ?? radius;
        }

        return radius;
    }, 0);
    const orbitRadius = (2 + clamp(normalRandom(2, 1, rng, GenerationSteps.ORBIT), 0, 10)) * parentMaxRadius;

    const parentIds = parentBodies.map((body) => body.id);

    const orbit: Orbit = {
        parentIds: parentIds,
        semiMajorAxis: orbitRadius,
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

    const faction = getFactionFromGalacticPosition(starSystemPosition, rng);

    //TODO: make this dependent on economic model
    const population = 2_000_000;
    const energyConsumptionPerCapitaKWh = 40_000;

    const populationDensity = 4_000;

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

    return {
        type: OrbitalObjectType.SPACE_STATION,
        seed,
        starSystemCoordinates: starSystemCoordinates,
        id: id,
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
        solarPanelEfficiency,
    };
}
