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
import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../../settings";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { clamp } from "../../utils/math";
import { getOrbitalPeriod, getPeriapsis, Orbit } from "../../orbit/orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PlanetModel } from "../../architecture/planet";
import { PlanetPhysicalProperties } from "../../architecture/physicalProperties";
import { CelestialBodyModel, CelestialBodyType } from "../../architecture/celestialBody";
import { RingsModel } from "../../rings/ringsModel";
import { GenerationSteps } from "../../utils/generationSteps";
import { getPlanetName } from "../common";
import { StarSystemModel } from "../../starSystem/starSystemModel";
import i18n from "../../i18n";

export class GasPlanetModel implements PlanetModel {
    readonly name: string;
    readonly bodyType = CelestialBodyType.GAS_PLANET;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly orbit: Orbit;

    readonly physicalProperties: PlanetPhysicalProperties;

    readonly rings: RingsModel | null;

    readonly nbMoons: number;

    readonly parentBody: CelestialBodyModel | null;

    readonly childrenBodies: CelestialBodyModel[] = [];

    readonly starSystem: StarSystemModel;

    readonly typeName = i18n.t("objectTypes:gasPlanet");

    constructor(seed: number, starSystem: StarSystemModel, parentBody?: CelestialBodyModel) {
        this.seed = seed;

        this.rng = seededSquirrelNoise(this.seed);

        this.parentBody = parentBody ?? null;

        this.starSystem = starSystem;

        this.name = getPlanetName(this.seed, this.starSystem, this.parentBody);

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
            normalToPlane: orbitalPlaneNormal
        };

        this.physicalProperties = {
            //FIXME: when Settings.Earth radius gets to 1:1 scale, change this value by a variable in settings
            mass: Settings.JUPITER_MASS * (this.radius / 69_911e3) ** 3,
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
}
