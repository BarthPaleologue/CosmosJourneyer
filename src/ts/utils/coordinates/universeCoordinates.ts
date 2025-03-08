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

import { UniverseObjectId } from "./universeObjectId";

export type UniverseCoordinates = {
    /**
     * The coordinates of the body in the universe.
     */
    universeObjectId: UniverseObjectId;

    /**
     * The x coordinate of the player's position in the nearest orbital object's frame of reference.
     */
    positionX: number;

    /**
     * The y coordinate of the player's position in the nearest orbital object's frame of reference.
     */
    positionY: number;

    /**
     * The z coordinate of the player's position in the nearest orbital object's frame of reference.
     */
    positionZ: number;

    /**
     * The x component of the player's rotation quaternion in the nearest orbital object's frame of reference.
     */
    rotationQuaternionX: number;

    /**
     * The y component of the player's rotation quaternion in the nearest orbital object's frame of reference.
     */
    rotationQuaternionY: number;

    /**
     * The z component of the player's rotation quaternion in the nearest orbital object's frame of reference.
     */
    rotationQuaternionZ: number;

    /**
     * The w component of the player's rotation quaternion in the nearest orbital object's frame of reference.
     */
    rotationQuaternionW: number;
};
