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
import { OrbitProperties } from "../orbit/orbitProperties";
import { getOrbitalPeriod } from "../orbit/orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { OrbitalObjectModel } from "../architecture/orbitalObject";
import { OrbitalObjectPhysicalProperties } from "../architecture/physicalProperties";
import { CelestialBodyModel } from "../architecture/celestialBody";
import { normalRandom, uniformRandBool } from "extended-random";
import { clamp } from "../utils/math";
import { GenerationSteps } from "../utils/generationSteps";
import { CropType, CropTypes } from "../utils/agriculture";
import { randomPieChart } from "../utils/random";
import { generateSpaceStationName } from "../utils/spaceStationNameGenerator";
import { StarSystemModel } from "../starSystem/starSystemModel";
import { Faction } from "../powerplay/factions";
import { getPowerPlayData } from "../powerplay/powerplay";
import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";

export class SpaceStationModel implements OrbitalObjectModel {
    readonly name: string;

    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly starSystem: StarSystemModel;

    readonly orbit: OrbitProperties;
    readonly physicalProperties: OrbitalObjectPhysicalProperties;
    readonly parentBody: OrbitalObjectModel | null;
    readonly childrenBodies: OrbitalObjectModel[] = [];

    readonly population: number;
    readonly energyConsumptionPerCapita: number;

    /**
     * The number of inhabitants per square kilometer in the habitat
     */
    readonly populationDensity: number;

    readonly agricultureMix: [number, CropType][];

    readonly nbHydroponicLayers: number;

    readonly faction: Faction;

    constructor(seed: number, starSystemModel: StarSystemModel, parentBody?: CelestialBodyModel) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.starSystem = starSystemModel;

        this.name = generateSpaceStationName(this.rng, 2756);

        this.parentBody = parentBody ?? null;
        this.childrenBodies = [];

        const orbitRadius = (2 + clamp(normalRandom(2, 1, this.rng, GenerationSteps.ORBIT), 0, 10)) * (parentBody?.radius ?? 0);

        this.orbit = {
            radius: orbitRadius,
            p: 2,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: Vector3.Up(),
            isPlaneAlignedWithParent: false
        };

        this.physicalProperties = {
            mass: 1,
            rotationPeriod: 0,
            axialTilt: 2 * this.rng(GenerationSteps.AXIAL_TILT) * Math.PI
        };

        const powerplayData = this.starSystem instanceof SeededStarSystemModel ? getPowerPlayData(this.starSystem.seed) : { materialistSpiritualist: 0.5, capitalistCommunist: 0.5 };

        const isMaterialist = uniformRandBool(powerplayData.materialistSpiritualist, this.rng, 249);
        const isCapitalist = uniformRandBool(powerplayData.capitalistCommunist, this.rng, 498);

        if (isMaterialist && isCapitalist) {
            this.faction = Faction.FEYNMAN_INTERSTELLAR;
        } else if (isMaterialist && !isCapitalist) {
            this.faction = Faction.HUMAN_COMMONWEALTH;
        } else if (!isMaterialist && isCapitalist) {
            this.faction = Faction.CHURCH_OF_AWAKENING;
        } else {
            this.faction = Faction.SATORI_CONCORD;
        }

        //TODO: make this dependent on economic model
        this.population = 2_000_000;
        this.energyConsumptionPerCapita = 40_000;

        this.populationDensity = 4_000;

        const mix = randomPieChart(CropTypes.length, this.rng, 498);
        this.agricultureMix = mix.map((proportion, index) => [proportion, CropTypes[index]]);

        this.nbHydroponicLayers = 10;
    }
}
