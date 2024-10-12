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
import { normalRandom, randRange } from "extended-random";
import { clamp } from "../../utils/math";
import { getOrbitalPeriod, getPeriapsis, Orbit } from "../../orbit/orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CelestialBodyModel, CelestialBodyType } from "../../architecture/celestialBody";
import { GenerationSteps } from "../../utils/generationSteps";
import i18n from "../../i18n";
import { OrbitalObjectPhysicalProperties } from "../../architecture/physicalProperties";
import { AnomalyType } from "../anomalyType";
import { AnomalyModel } from "../anomaly";

import { getRngFromSeed } from "../../utils/getRngFromSeed";

export type MandelbulbModel = AnomalyModel & {
    readonly bodyType: CelestialBodyType.ANOMALY;
    readonly anomalyType: AnomalyType.MANDELBULB;

    readonly power: number;
    readonly accentColor: Color3;
};

export function newSeededMandelbulbModel(seed: number, name: string, parentBody: CelestialBodyModel | null): MandelbulbModel {
    const rng = getRngFromSeed(seed);

    const radius = 1000e3;

    const power = randRange(4.0, 8.0, rng, GenerationSteps.POWER);
    const accentColor = Color3.FromHSV(360 * rng(GenerationSteps.ACCENT_COLOR), rng(GenerationSteps.ACCENT_COLOR + 123) * 0.5, 0.8);

    // Todo: do not hardcode
    let orbitRadius = rng(GenerationSteps.ORBIT) * 15e9;

    const orbitalP = clamp(0.5, 3.0, normalRandom(1.0, 0.3, rng, GenerationSteps.ORBIT + 80));
    orbitRadius += orbitRadius - getPeriapsis(orbitRadius, orbitalP);

    const orbit: Orbit = {
        radius: orbitRadius,
        p: orbitalP,
        period: getOrbitalPeriod(orbitRadius, parentBody?.physicalProperties.mass ?? 0),
        normalToPlane: Vector3.Up()
    };

    const physicalProperties: OrbitalObjectPhysicalProperties = {
        mass: 10,
        rotationPeriod: 0,
        axialTilt: normalRandom(0, 0.4, rng, GenerationSteps.AXIAL_TILT)
    };

    const typeName = i18n.t("objectTypes:anomaly");

    return {
        seed,
        radius,
        rings: null,
        name,
        bodyType: CelestialBodyType.ANOMALY,
        anomalyType: AnomalyType.MANDELBULB,
        accentColor,
        power,
        orbit,
        physicalProperties,
        parentBody,
        typeName
    };
}
