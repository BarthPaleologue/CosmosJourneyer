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

export type GasPlanetModel = PlanetModel & {
    readonly name: string;
    readonly bodyType: CelestialBodyType.GAS_PLANET;
    readonly seed: number;

    readonly radius: number;

    readonly orbit: Orbit;

    readonly physicalProperties: PlanetPhysicalProperties;

    readonly rings: RingsModel | null;

    readonly nbMoons: number;

    readonly parentBody: CelestialBodyModel | null;

    readonly typeName: string;
};

export function newSeededGasPlanetModel(seed: number, starSystem: StarSystemModel, parentBody: CelestialBodyModel | null): GasPlanetModel {
    const rng = seededSquirrelNoise(seed);

    const name = getPlanetName(seed, starSystem, parentBody);

    const radius = randRangeInt(Settings.EARTH_RADIUS * 4, Settings.EARTH_RADIUS * 20, rng, GenerationSteps.RADIUS);

    // Todo: do not hardcode
    let orbitRadius = rng(GenerationSteps.ORBIT) * 15e9;

    const orbitalP = clamp(0.7, 3.0, normalRandom(2.0, 0.3, rng, GenerationSteps.ORBIT + 80));
    orbitRadius += orbitRadius - getPeriapsis(orbitRadius, orbitalP);
    if (parentBody) orbitRadius += parentBody.radius * 1.5;

    const orbitalPlaneNormal = Vector3.Up().applyRotationQuaternionInPlace(Quaternion.RotationAxis(Axis.X, (rng(GenerationSteps.ORBIT + 20) - 0.5) * 0.2));

    const orbit: Orbit = {
        radius: orbitRadius,
        p: 2, //orbitalP,
        period: getOrbitalPeriod(orbitRadius, parentBody?.physicalProperties.mass ?? 0),
        normalToPlane: orbitalPlaneNormal
    };

    const physicalProperties: PlanetPhysicalProperties = {
        //FIXME: when Settings.Earth radius gets to 1:1 scale, change this value by a variable in settings
        mass: Settings.JUPITER_MASS * (radius / 69_911e3) ** 3,
        axialTilt: normalRandom(0, 0.4, rng, GenerationSteps.AXIAL_TILT),
        rotationPeriod: (24 * 60 * 60) / 10,
        minTemperature: -180,
        maxTemperature: 200,
        pressure: 1
    };

    const rings = uniformRandBool(0.8, rng, GenerationSteps.RINGS) ? new RingsModel(rng) : null;

    const nbMoons = randRangeInt(0, 3, rng, GenerationSteps.NB_MOONS);

    return {
        name: name,
        seed: seed,
        parentBody: parentBody,
        rng: rng,
        bodyType: CelestialBodyType.GAS_PLANET,
        radius: radius,
        orbit: orbit,
        physicalProperties: physicalProperties,
        rings: rings,
        nbMoons: nbMoons,
        typeName: i18n.t("objectTypes:gasPlanet")
    };
}
