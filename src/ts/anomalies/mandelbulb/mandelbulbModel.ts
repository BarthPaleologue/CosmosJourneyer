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

import { seededSquirrelNoise } from "squirrel-noise";

import { OrbitProperties } from "../../orbit/orbitProperties";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { normalRandom, randRange, randRangeInt } from "extended-random";
import { clamp } from "../../utils/math";
import { getOrbitalPeriod, getPeriapsis } from "../../orbit/orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PlanetModel } from "../../architecture/planet";
import { PlanetPhysicalProperties } from "../../architecture/physicalProperties";
import { CelestialBodyModel } from "../../architecture/celestialBody";
import { BodyType } from "../../architecture/bodyType";
import { GenerationSteps } from "../../utils/generationSteps";
import { wheelOfFortune } from "../../utils/random";

export class MandelbulbModel implements PlanetModel {
    readonly bodyType = BodyType.MANDELBULB;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly orbit: OrbitProperties;

    readonly physicalProperties: PlanetPhysicalProperties;

    readonly parentBody: CelestialBodyModel | null;

    readonly childrenBodies: CelestialBodyModel[] = [];

    readonly nbMoons: number;

    readonly ringsUniforms = null;

    readonly power: number;
    readonly accentColor: Color3;

    constructor(seed: number, parentBody?: CelestialBodyModel) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.radius = 1000e3;

        this.parentBody = parentBody ?? null;

        this.power = randRange(4.0, 8.0, this.rng, GenerationSteps.POWER);
        this.accentColor = Color3.FromHSV(360 * this.rng(GenerationSteps.ACCENT_COLOR), this.rng(GenerationSteps.ACCENT_COLOR + 123) * 0.5, 0.8);

        // Todo: do not hardcode
        let orbitRadius = this.rng(GenerationSteps.ORBIT) * 15e9;

        const orbitalP = clamp(0.5, 3.0, normalRandom(1.0, 0.3, this.rng, GenerationSteps.ORBIT + 80));
        orbitRadius += orbitRadius - getPeriapsis(orbitRadius, orbitalP);

        this.orbit = {
            radius: orbitRadius,
            p: orbitalP,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: Vector3.Up(),
            isPlaneAlignedWithParent: true
        };

        this.physicalProperties = {
            mass: 10,
            rotationPeriod: 0,
            axialTilt: normalRandom(0, 0.4, this.rng, GenerationSteps.AXIAL_TILT),
            minTemperature: -180,
            maxTemperature: 100,
            pressure: 0
        };

        this.nbMoons = wheelOfFortune(
            [
                [0, 0.95],
                [1, 0.5]
            ],
            this.rng(GenerationSteps.NB_MOONS)
        );
    }

    getApparentRadius(): number {
        return this.radius;
    }

    getNbSpaceStations(): number {
        return 0;
    }
}
