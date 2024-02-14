//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { CelestialBodyModel } from "../../architecture/celestialBody";
import { BodyType, GenerationSteps } from "../../model/common";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { StarPhysicalProperties } from "../../architecture/physicalProperties";
import { StellarObjectModel } from "../../architecture/stellarObject";
import { seededSquirrelNoise } from "squirrel-noise";
import { getRgbFromTemperature } from "../../utils/specrend";
import { getOrbitalPeriod } from "../../orbit/orbit";
import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { RingsUniforms } from "../../postProcesses/rings/ringsUniform";
import { clamp } from "../../utils/math";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export class NeutronStarModel implements StellarObjectModel {
    readonly bodyType = BodyType.NEUTRON_STAR;
    readonly rng: (step: number) => number;
    readonly seed: number;

    readonly temperature: number;
    readonly color: Color3;
    readonly radius: number;

    readonly orbit: OrbitProperties;

    readonly physicalProperties: StarPhysicalProperties;

    static RING_PROPORTION = 0.02;

    readonly ringsUniforms;

    readonly parentBody: CelestialBodyModel | null;

    readonly childrenBodies: CelestialBodyModel[] = [];

    constructor(seed: number, parentBody: CelestialBodyModel | null = null) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.temperature = randRangeInt(200_000, 5_000_000_000, this.rng, GenerationSteps.TEMPERATURE);
        this.color = getRgbFromTemperature(this.temperature);

        this.parentBody = parentBody;

        this.physicalProperties = {
            mass: 1000,
            rotationPeriod: 24 * 60 * 60,
            temperature: this.temperature,
            axialTilt: 0
        };

        this.radius = clamp(normalRandom(10e3, 1e3, this.rng, GenerationSteps.RADIUS), 2e3, 50e3);

        // Todo: do not hardcode
        const orbitRadius = this.rng(GenerationSteps.ORBIT) * 5000000e3;

        this.orbit = {
            radius: orbitRadius,
            p: 2,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: Vector3.Up(),
            isPlaneAlignedWithParent: true
        };

        if (uniformRandBool(NeutronStarModel.RING_PROPORTION, this.rng, GenerationSteps.RINGS)) {
            this.ringsUniforms = new RingsUniforms(this.rng);
        } else {
            this.ringsUniforms = null;
        }
    }

    public getNbSpaceStations(): number {
        if(uniformRandBool(0.00001, this.rng, GenerationSteps.SPACE_STATION)) return 1;
        return 0;
    }
}
