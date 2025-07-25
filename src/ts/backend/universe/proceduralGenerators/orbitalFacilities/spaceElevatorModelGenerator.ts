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

import { type Vector3 } from "@babylonjs/core/Maths/math.vector";

import { getFactionFromGalacticPosition } from "@/backend/society/factions";
import { type PlanetModel } from "@/backend/universe/orbitalObjects/index";
import { type Orbit } from "@/backend/universe/orbitalObjects/orbit";
import { type SpaceElevatorModel } from "@/backend/universe/orbitalObjects/orbitalFacilities/spaceElevatorModel";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";

import { CropTypes, type CropType } from "@/utils/agriculture";
import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { getOrbitRadiusFromPeriod } from "@/utils/physics/orbit";
import { randomPieChart } from "@/utils/random";
import { generateSpaceElevatorName } from "@/utils/strings/spaceStationNameGenerator";

export function newSeededSpaceElevatorModel(
    id: string,
    seed: number,
    starSystemCoordinates: StarSystemCoordinates,
    starSystemPosition: Vector3,
    parentBody: PlanetModel,
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
        type: OrbitalObjectType.SPACE_ELEVATOR,
        seed,
        starSystemCoordinates: starSystemCoordinates,
        id: id,
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
        solarPanelEfficiency,
    };
}
