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

import { Quaternion } from "@babylonjs/core/Maths/math";

export type OrbitalObjectPhysicsInfo = {
    mass: number;
    /**
     * Time needed for the object to rotate 360° on its axis in seconds.
     * It is slightly different from the duration of solar day which is the time it takes for the sun to be at the same position in the sky.
     * @see https://en.wikipedia.org/wiki/Sidereal_time
     */
    siderealDayDuration: number;
    axialTilt: Quaternion;
};

export type StellarObjectPhysicsInfo = OrbitalObjectPhysicsInfo & {
    /**
     * Black body temperature of the object in Kelvin
     */
    blackBodyTemperature: number;
};

export type BlackHolePhysicsInfo = StellarObjectPhysicsInfo & {
    accretionDiskRadius: number;
};

export type PlanetaryMassObjectPhysicsInfo = OrbitalObjectPhysicsInfo & {
    minTemperature: number;
    maxTemperature: number;
    pressure: number;
};

export type TelluricPlanetaryMassObjectPhysicsInfo = PlanetaryMassObjectPhysicsInfo & {
    waterAmount: number;
    oceanLevel: number;
};
