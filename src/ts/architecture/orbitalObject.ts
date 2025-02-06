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

import { Transformable } from "./transformable";
import { HasBoundingSphere } from "./hasBoundingSphere";
import { OrbitalObjectPhysicsInfo } from "./physicsInfo";
import { TypedObject } from "./typedObject";
import { Orbit } from "../orbit/orbit";
import { OrbitalObjectType } from "./orbitalObjectType";

/**
 * Describes all objects that can have an orbital trajectory and rotate on themselves
 */
export interface OrbitalObject extends Transformable, HasBoundingSphere, TypedObject {
    readonly model: OrbitalObjectModel;
}

/**
 * Describes the model of an orbital object
 */
export type OrbitalObjectModel = {
    /**
     * The name of the object
     */
    readonly name: string;

    /**
     * The seed used by the random number generator
     */
    readonly seed: number;

    /**
     * The type of the celestial body
     */
    readonly type: OrbitalObjectType;

    /**
     * Orbit properties of the object
     */
    readonly orbit: Orbit;

    /**
     * Physical properties of the object
     */
    readonly physics: OrbitalObjectPhysicsInfo;
};

export const SatelliteTypes = [OrbitalObjectType.TELLURIC_SATELLITE, OrbitalObjectType.SPACE_STATION];

export function isSatellite(orbitalObjectType: OrbitalObjectType): boolean {
    return SatelliteTypes.includes(orbitalObjectType);
}
