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

import { Color3 } from "@babylonjs/core/Maths/math.color";
import { normalRandom } from "extended-random";
import { clamp } from "../../utils/math";
import { getOrbitalPeriod, getPeriapsis, Orbit } from "../../orbit/orbit";
import { CelestialBodyModel } from "../../architecture/celestialBody";
import { GenerationSteps } from "../../utils/generationSteps";
import { OrbitalObjectPhysicsInfo } from "../../architecture/physicsInfo";
import { AnomalyModel } from "../anomaly";
import { getRngFromSeed } from "../../utils/getRngFromSeed";
import { OrbitalObjectType } from "../../architecture/orbitalObject";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { Axis } from "@babylonjs/core/Maths/math.axis";

export type SierpinskiPyramidModel = AnomalyModel & {
    readonly type: OrbitalObjectType.SIERPINSKI_PYRAMID;
    readonly accentColor: Color3;
};

export function newSeededSierpinskiPyramidModel(
    seed: number,
    name: string,
    parentBodies: CelestialBodyModel[]
): SierpinskiPyramidModel {
    const rng = getRngFromSeed(seed);

    const radius = 200e3;

    const accentColor = Color3.FromHSV(
        360 * rng(GenerationSteps.ACCENT_COLOR),
        rng(GenerationSteps.ACCENT_COLOR + 123) * 0.5,
        0.8
    );

    // Todo: do not hardcode
    let orbitRadius = rng(GenerationSteps.ORBIT) * 15e9;

    const orbitalP = clamp(0.5, 3.0, normalRandom(1.0, 0.3, rng, GenerationSteps.ORBIT + 80));
    orbitRadius += orbitRadius - getPeriapsis(orbitRadius, orbitalP);

    const parentMassSum = parentBodies?.reduce((sum, body) => sum + body.physics.mass, 0) ?? 0;
    const orbit: Orbit = {
        radius: orbitRadius,
        p: orbitalP,
        period: getOrbitalPeriod(orbitRadius, parentMassSum),
        orientation: Quaternion.Identity()
    };

    const physicalProperties: OrbitalObjectPhysicsInfo = {
        mass: 10,
        siderealDaySeconds: 0,
        axialTilt: Quaternion.RotationAxis(Axis.X, normalRandom(0, 0.4, rng, GenerationSteps.AXIAL_TILT))
    };

    return {
        seed,
        radius,
        rings: null,
        name,
        type: OrbitalObjectType.SIERPINSKI_PYRAMID,
        accentColor,
        orbit,
        physics: physicalProperties
    };
}
