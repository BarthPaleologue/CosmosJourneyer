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
import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../../settings";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { clamp } from "../../utils/math";
import { getOrbitalPeriod, getPeriapsis } from "../../orbit/orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PlanetModel } from "../../architecture/planet";
import { PlanetPhysicalProperties } from "../../architecture/physicalProperties";
import { CelestialBodyModel } from "../../architecture/celestialBody";
import { RingsModel } from "../../rings/ringsModel";
import { BodyType } from "../../architecture/bodyType";
import { GenerationSteps } from "../../utils/generationSteps";

export class GasPlanetModel implements PlanetModel {
    readonly bodyType = BodyType.GAS_PLANET;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly orbit: OrbitProperties;

    readonly physicalProperties: PlanetPhysicalProperties;

    readonly rings: RingsModel | null;

    readonly nbMoons: number;

    readonly parentBody: CelestialBodyModel | null;

    readonly childrenBodies: CelestialBodyModel[] = [];

    constructor(seed: number, parentBody?: CelestialBodyModel) {
        this.seed = seed;

        this.rng = seededSquirrelNoise(this.seed);

        this.parentBody = parentBody ?? null;

        this.radius = randRangeInt(Settings.EARTH_RADIUS * 4, Settings.EARTH_RADIUS * 20, this.rng, GenerationSteps.RADIUS);

        // Todo: do not hardcode
        let orbitRadius = this.rng(GenerationSteps.ORBIT) * 15e9;

        const orbitalP = clamp(0.7, 3.0, normalRandom(2.0, 0.3, this.rng, GenerationSteps.ORBIT + 80));
        orbitRadius += orbitRadius - getPeriapsis(orbitRadius, orbitalP);
        if (parentBody) orbitRadius += parentBody.radius * 1.5;

        const orbitalPlaneNormal = Vector3.Up().applyRotationQuaternionInPlace(Quaternion.RotationAxis(Axis.X, (this.rng(GenerationSteps.ORBIT + 20) - 0.5) * 0.2));

        this.orbit = {
            radius: orbitRadius,
            p: 2, //orbitalP,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: orbitalPlaneNormal,
            isPlaneAlignedWithParent: true
        };

        this.physicalProperties = {
            // Fixme: choose physically accurate values
            mass: 10,
            axialTilt: normalRandom(0, 0.4, this.rng, GenerationSteps.AXIAL_TILT),
            rotationPeriod: (24 * 60 * 60) / 10,
            minTemperature: -180,
            maxTemperature: 200,
            pressure: 1
        };

        if (uniformRandBool(0.8, this.rng, GenerationSteps.RINGS)) {
            this.rings = new RingsModel(this.rng);
        } else {
            this.rings = null;
        }

        this.nbMoons = randRangeInt(0, 3, this.rng, GenerationSteps.NB_MOONS);
    }

    getApparentRadius(): number {
        return this.radius;
    }

    public getNbSpaceStations(): number {
        if (uniformRandBool(0.2, this.rng, GenerationSteps.SPACE_STATIONS)) return 1;
        if (uniformRandBool(0.1, this.rng, GenerationSteps.SPACE_STATIONS + 10)) return 2;
        return 0;
    }
}
