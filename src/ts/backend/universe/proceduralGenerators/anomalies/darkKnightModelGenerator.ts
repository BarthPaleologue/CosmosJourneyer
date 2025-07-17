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

import { type DarkKnightModel } from "@/backend/universe/orbitalObjects/anomalies/darkKnightModel";
import { type OrbitalObjectId } from "@/backend/universe/orbitalObjects/orbitalObjectId";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";

import { EarthMass } from "@/utils/physics/constants";
import { astronomicalUnitToMeters } from "@/utils/physics/unitConversions";

export function generateDarkKnightModel(parentIds: ReadonlyArray<OrbitalObjectId>): DarkKnightModel {
    return {
        type: OrbitalObjectType.DARK_KNIGHT,
        id: "darkKnight",
        name: "Dark Knight",
        axialTilt: 0,
        siderealDaySeconds: 0,
        radius: 100e3,
        mass: EarthMass,
        orbit: {
            parentIds: [...parentIds],
            argumentOfPeriapsis: 0,
            eccentricity: 0,
            p: 1,
            inclination: 0,
            longitudeOfAscendingNode: 0,
            semiMajorAxis: astronomicalUnitToMeters(100),
            initialMeanAnomaly: 0,
        },
    };
}
