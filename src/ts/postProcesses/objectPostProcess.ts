//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { Transformable } from "../architecture/transformable";
import { Camera } from "@babylonjs/core/Cameras/camera";

export interface UpdatablePostProcess extends PostProcess {
    /**
     * Updates the post process internal clock so that time-dependent effects can be updated.
     * @param deltaTime The time in seconds since the last update
     */
    update(deltaTime: number): void;
}

export interface ObjectPostProcess extends PostProcess {
    /**
     * The object this post process will be attached to.
     * This makes sense for raymarching and raytracing shaders that need to know the position of the object.
     */
    readonly object: Transformable;
    dispose(camera: Camera): void;
}
