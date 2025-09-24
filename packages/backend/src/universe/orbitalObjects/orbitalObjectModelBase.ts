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

import { type Orbit } from "./orbit";
import { type OrbitalObjectId } from "./orbitalObjectId";
import { type OrbitalObjectType } from "./orbitalObjectType";

/**
 * Describes the model of an orbital object
 */
export type OrbitalObjectModelBase<T extends OrbitalObjectType> = {
    type: T;

    /**
     * The id of the object (unique within the star system)
     */
    id: OrbitalObjectId;

    /**
     * The name of the object
     */
    name: string;

    /**
     * Orbit properties of the object
     */
    orbit: Orbit;

    /**
     * Mass of the object in kilograms
     */
    mass: number;

    /**
     * Time needed for the object to rotate 360° on its axis in seconds.
     * It is slightly different from the duration of solar day which is the time it takes for the sun to be at the same position in the sky.
     * @see https://en.wikipedia.org/wiki/Sidereal_time
     */
    siderealDaySeconds: number;

    /**
     * the angle between an object's rotational axis and its orbital axis, which is the line perpendicular to its orbital plane
     * @see https://en.wikipedia.org/wiki/Axial_tilt
     */
    axialTilt: number;
};

export type CelestialBodyModelBase<T extends OrbitalObjectType> = OrbitalObjectModelBase<T> & {
    /**
     * The radius of the celestial body in meters
     */
    radius: number;
};
