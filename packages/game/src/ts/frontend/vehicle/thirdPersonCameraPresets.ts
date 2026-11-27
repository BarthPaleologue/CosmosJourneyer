//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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
import { meters, radians } from "@cosmos-journeyer/physics";
import type { Meters, Radians } from "@cosmos-journeyer/physics";

export type ThirdPersonCameraPreset = {
    radius: Meters;
    alpha: Radians;
    beta: Radians;
    target: Vector3;
};

export const thirdPersonCameraPresets = {
    behindCentered: {
        radius: meters(20),
        alpha: radians(Math.PI / 2),
        beta: radians(0.95 * (Math.PI / 2)),
        target: Vector3.Zero(),
    },
    behindLeft: {
        radius: meters(12.889298902636686),
        alpha: radians(1.750116937499197),
        beta: radians(1.4840003658100764),
        target: new Vector3(-5.316114307854391, 0, -0.8288236509902596),
    },
    behindRight: {
        radius: meters(12.889298902636686),
        alpha: radians(Math.PI - 1.750116937499197),
        beta: radians(1.4840003658100764),
        target: new Vector3(5.316114307854391, 0, -0.8288236509902596),
    },
    frontLookingRight: {
        radius: meters(20.148901461353812),
        alpha: radians(Math.PI + 0.9488003121154529),
        beta: radians(1.5921606144494687),
        target: new Vector3(6.382027891198554, 0, -3.1248896402381923),
    },
    frontLookingLeft: {
        radius: meters(20.148901461353812),
        alpha: radians(-0.9488003121154529),
        beta: radians(1.5921606144494687),
        target: new Vector3(-6.382027891198554, 0, -3.1248896402381923),
    },
} as const satisfies Record<string, ThirdPersonCameraPreset>;

export type ThirdPersonCameraPresetNames = keyof typeof thirdPersonCameraPresets;
