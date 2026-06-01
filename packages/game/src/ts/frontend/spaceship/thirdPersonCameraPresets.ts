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

export type ThirdPersonCameraPreset = {
    radius: number;
    alpha: number;
    beta: number;
    target: Vector3;
};

export const thirdPersonCameraPresets = {
    behindCentered: {
        radius: 60,
        alpha: 3.14 / 2,
        beta: 3.14 / 2.2,
        target: Vector3.Zero(),
    },
    frontCentered: {
        radius: 60,
        alpha: -3.14 / 2,
        beta: 3.14 / 2.2,
        target: Vector3.Zero(),
    },
    onRightWing: {
        radius: 24,
        alpha: 1.4,
        beta: 1.4,
        target: new Vector3(11, 0, -11),
    },
    onLeftWing: {
        radius: 24,
        alpha: Math.PI - 1.4,
        beta: 1.4,
        target: new Vector3(-11, 0, -11),
    },
    underBelly: {
        radius: 45.37510024434761,
        alpha: -1.6200480258800203,
        beta: 2.0127308430713713,
        target: new Vector3(2.7245544396057473, 11.891621134326973, 22.92345975874762),
    },
    cockpitSelfie: {
        radius: 29.318232551394654,
        alpha: -1.5998467158450924,
        beta: 1.1911982911165055,
        target: new Vector3(0.9415595170643695, -5.6552997142865005, 14.77185995314097),
    },
} as const satisfies Record<string, ThirdPersonCameraPreset>;

export type ThirdPersonCameraPresetNames = keyof typeof thirdPersonCameraPresets;
