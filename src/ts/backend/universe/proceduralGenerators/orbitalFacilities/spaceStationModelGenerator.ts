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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Tools } from "@babylonjs/core/Misc/tools";
import { normalRandom } from "extended-random";

import { CropType, CropTypes } from "../../../../utils/agriculture";
import { StarSystemCoordinates } from "../../../../utils/coordinates/starSystemCoordinates";
import { GenerationSteps } from "../../../../utils/generationSteps";
import { getRngFromSeed } from "../../../../utils/getRngFromSeed";
import { clamp } from "../../../../utils/math";
import { randomPieChart } from "../../../../utils/random";
import { generateSpaceStationName } from "../../../../utils/strings/spaceStationNameGenerator";
import { getFactionFromGalacticPosition } from "../../../society/factions";
import { Orbit } from "../../orbitalObjects/orbit";
import { SpaceStationModel } from "../../orbitalObjects/orbitalFacilities/spacestationModel";
import { OrbitalObjectType } from "../../orbitalObjects/orbitalObjectType";
import { CelestialBodyModel } from "../architecture/orbitalObjectModel";

export function newSeededSpaceStationModel(
    id: string,
    seed: number,
    starSystemCoordinates: StarSystemCoordinates,
    starSystemPosition: Vector3,
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
            radius += (body.rings?.ringEnd ?? 0) * body.radius;
        }

        return radius;
    }, 0);
    const orbitRadius = (2 + clamp(normalRandom(2, 1, rng, GenerationSteps.ORBIT), 0, 10)) * parentMaxRadius;

    const parentIds = parentBodies.map((body) => body.id);

    const orbit: Orbit = {
        parentIds: parentIds,
        semiMajorAxis: orbitRadius,
        p: 2,
        inclination: Tools.ToRadians(normalRandom(0, 10, rng, GenerationSteps.ORBIT + 10)),
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
