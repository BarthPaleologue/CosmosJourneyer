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

import { type Camera } from "@babylonjs/core/Cameras/camera";

import { type Transformable } from "@/frontend/universe/architecture/transformable";

export interface Controls extends Transformable {
    /**
     * Returns the camera used by the controls.
     */
    getActiveCamera(): Camera;

    getCameras(): Camera[];

    shouldLockPointer(): boolean;

    /**
     * Makes the controller listen to all its inputs and update its state.
     * @param deltaSeconds the time between 2 frames
     */
    update(deltaSeconds: number): void;
}
