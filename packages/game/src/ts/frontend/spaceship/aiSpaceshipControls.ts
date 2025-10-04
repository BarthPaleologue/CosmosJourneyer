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

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { type Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { type Controls } from "@/frontend/controls";

import { type Spaceship } from "./spaceship";

export class AiSpaceshipControls implements Controls {
    readonly spaceship: Spaceship;

    readonly thirdPersonCamera: Camera;

    constructor(spaceship: Spaceship, scene: Scene) {
        this.spaceship = spaceship;

        this.thirdPersonCamera = new ArcRotateCamera("shipThirdPersonCamera", 0, 0, 50, Vector3.Zero(), scene);
    }

    getTransform(): TransformNode {
        return this.spaceship.getTransform();
    }

    getActiveCamera(): Camera {
        return this.thirdPersonCamera;
    }

    getCameras(): Camera[] {
        return [this.thirdPersonCamera];
    }

    shouldLockPointer(): boolean {
        return false;
    }

    update(): Vector3 {
        return Vector3.Zero();
    }

    dispose(soundPlayer: ISoundPlayer) {
        this.spaceship.dispose(soundPlayer);
    }
}
