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

import { seededSquirrelNoise } from "squirrel-noise";
import { getOrbitalPeriod, Orbit } from "../orbit/orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { OrbitalObjectModel } from "../architecture/orbitalObject";
import { OrbitalObjectPhysicalProperties } from "../architecture/physicalProperties";
import { CelestialBodyModel, CelestialBodyType } from "../architecture/celestialBody";
import { normalRandom, uniformRandBool } from "extended-random";
import { clamp } from "../utils/math";
import { GenerationSteps } from "../utils/generationSteps";
import { CropType, CropTypes, getEdibleEnergyPerHaPerDay } from "../utils/agriculture";
import { randomPieChart } from "../utils/random";
import { generateSpaceStationName } from "../utils/spaceStationNameGenerator";
import { StarSystemCoordinates, StarSystemModel } from "../starSystem/starSystemModel";
import { Faction } from "../society/factions";
import { getPowerPlayData } from "../society/powerplay";
import { newSeededNeutronStarModel } from "../stellarObjects/neutronStar/neutronStarModel";
import { newSeededBlackHoleModel } from "../stellarObjects/blackHole/blackHoleModel";
import { newSeededStarModel } from "../stellarObjects/star/starModel";
import { getSolarPanelSurfaceFromEnergyRequirement } from "../utils/solarPanels";
import { Settings } from "../settings";
import i18n from "../i18n";
import { getStellarObjectName } from "../utils/parseToStrings";

export type SpaceStationModel = OrbitalObjectModel & {
    readonly starSystemCoordinates: StarSystemCoordinates;

    readonly population: number;

    /**
     * The average energy consumption of a citizen of the habitat in KWh
     */
    readonly energyConsumptionPerCapitaKWh: number;

    /**
     * The number of inhabitants per square kilometer in the habitat
     */
    readonly populationDensity: number;

    readonly agricultureMix: [number, CropType][];

    readonly nbHydroponicLayers: number;

    readonly faction: Faction;

    /**
     * The total energy consumption of the habitat in KWh
     */
    readonly totalEnergyConsumptionKWh: number;
    readonly solarPanelEfficiency: number;

    /**
     * The surface of solar panels in m²
     */
    readonly solarPanelSurfaceM2: number;

    readonly housingSurfaceHa: number;
    readonly agricultureSurfaceHa: number;
    readonly totalHabitatSurfaceM2: number;
};

export function newSeededSpaceStationModel(seed: number, starSystemModel: StarSystemModel, parentBody: CelestialBodyModel | null): SpaceStationModel {
    const rng = seededSquirrelNoise(seed);

    const name = generateSpaceStationName(rng, 2756);

    const orbitRadius = (2 + clamp(normalRandom(2, 1, rng, GenerationSteps.ORBIT), 0, 10)) * (parentBody?.radius ?? 0);

    const orbit: Orbit = {
        radius: orbitRadius,
        p: 2,
        period: getOrbitalPeriod(orbitRadius, parentBody?.physicalProperties.mass ?? 0),
        normalToPlane: Vector3.Up()
    };

    const physicalProperties: OrbitalObjectPhysicalProperties = {
        mass: 1,
        rotationPeriod: 0,
        axialTilt: 2 * rng(GenerationSteps.AXIAL_TILT) * Math.PI
    };

    const powerplayData = getPowerPlayData(starSystemModel.getCoordinates());

    const isMaterialist = uniformRandBool(powerplayData.materialistSpiritualist, rng, 249);
    const isCapitalist = uniformRandBool(powerplayData.capitalistCommunist, rng, 498);

    let faction: Faction;
    if (isMaterialist && isCapitalist) {
        faction = Faction.FEYNMAN_INTERSTELLAR;
    } else if (isMaterialist && !isCapitalist) {
        faction = Faction.HUMAN_COMMONWEALTH;
    } else if (!isMaterialist && isCapitalist) {
        faction = Faction.CHURCH_OF_AWAKENING;
    } else {
        faction = Faction.SATORI_CONCORD;
    }

    //TODO: make this dependent on economic model
    const population = 2_000_000;
    const energyConsumptionPerCapitaKWh = 40_000;

    const populationDensity = 4_000;

    const mix = randomPieChart(CropTypes.length, rng, 498);
    const agricultureMix: [number, CropType][] = mix.map((proportion, index) => [proportion, CropTypes[index]]);

    const nbHydroponicLayers = 10;

    const starModelBuildInfo = starSystemModel.getStellarObjects()[0];
    let starModel;
    const stellarObjectName = getStellarObjectName(starSystemModel.name, 0);
    switch (starModelBuildInfo[0]) {
        case CelestialBodyType.NEUTRON_STAR:
            starModel = newSeededNeutronStarModel(starModelBuildInfo[1], starSystemModel, null);
            break;
        case CelestialBodyType.BLACK_HOLE:
            starModel = newSeededBlackHoleModel(starModelBuildInfo[1], starSystemModel, null);
            break;
        case CelestialBodyType.STAR:
            starModel = newSeededStarModel(starModelBuildInfo[1], stellarObjectName, null);
            break;
        default:
            throw new Error("Unknown star type");
    }

    // find distance to star
    const distanceToStar = parentBody ? parentBody?.orbit.radius : 0;

    const starRadius = starModel.radius;
    const starTemperature = starModel.temperature;
    const totalEnergyConsumptionKWh = population * energyConsumptionPerCapitaKWh;

    const solarPanelEfficiency = 0.4;

    const solarPanelSurfaceM2 = getSolarPanelSurfaceFromEnergyRequirement(solarPanelEfficiency, distanceToStar, starTemperature, starRadius, totalEnergyConsumptionKWh, 0.5);

    const housingSurfaceHa = (100 * population) / populationDensity; // convert km² to ha
    let agricultureSurfaceHa = 0;
    agricultureMix.forEach(([fraction, cropType]) => {
        agricultureSurfaceHa +=
            (fraction * population * Settings.INDIVIDUAL_AVERAGE_DAILY_INTAKE) /
            (Settings.HYDROPONIC_TO_CONVENTIONAL_RATIO * nbHydroponicLayers * getEdibleEnergyPerHaPerDay(cropType));
    });
    const totalHabitatSurfaceM2 = (housingSurfaceHa + agricultureSurfaceHa) * 1000; // convert ha to m²

    const typeName = i18n.t("objectTypes:spaceStation");

    return {
        seed,
        starSystemCoordinates: starSystemModel.getCoordinates(),
        name,
        rng,
        parentBody,
        orbit,
        physicalProperties,
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
        totalHabitatSurfaceM2,
        typeName
    };
}
