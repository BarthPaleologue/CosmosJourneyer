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

import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { LocalDirection } from "../uberCore/localDirections";
import { getUpwardDirection, pitch, roll } from "../uberCore/transforms/basicTransform";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Controls } from "../uberCore/controls";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Spaceship } from "./spaceship";
import { SpaceShipControlsInputs } from "./spaceShipControlsInputs";

export class ShipControls implements Controls {
    readonly spaceship: Spaceship;

    readonly thirdPersonCamera: ArcRotateCamera;
    readonly firstPersonCamera: FreeCamera;

    private readonly scene: Scene;

    constructor(scene: Scene) {
        this.spaceship = new Spaceship(scene);

        this.firstPersonCamera = new FreeCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.parent = this.getTransform();
        this.firstPersonCamera.position = new Vector3(0, 1, 0);

        this.thirdPersonCamera = new ArcRotateCamera("thirdPersonCamera", -3.14 / 2, 3.14 / 2, 30, Vector3.Zero(), scene);
        this.thirdPersonCamera.parent = this.getTransform();
        this.thirdPersonCamera.lowerRadiusLimit = 10;
        this.thirdPersonCamera.upperRadiusLimit = 500;

        this.scene = scene;

        SpaceShipControlsInputs.toggleFlightAssist.on("complete", () => {
            this.spaceship.setFlightAssistEnabled(!this.spaceship.getFlightAssistEnabled());
        });

        SpaceShipControlsInputs.toggleWarpDrive.on("complete", () => {
            this.spaceship.toggleWarpDrive();
        });
    }

    public getTransform(): TransformNode {
        return this.spaceship.getTransform();
    }

    public getActiveCamera(): Camera {
        return this.thirdPersonCamera;
    }

    public update(deltaTime: number): Vector3 {
        this.spaceship.update(deltaTime);

        const [inputRoll, inputPitch] = SpaceShipControlsInputs.rollPitch.value;

        if (this.spaceship.getWarpDrive().isDisabled()) {
            for (const thruster of this.spaceship.mainThrusters) {
                thruster.updateThrottle(2 * deltaTime * SpaceShipControlsInputs.throttle.value * thruster.getAuthority01(LocalDirection.FORWARD));
                thruster.updateThrottle(2 * deltaTime * -SpaceShipControlsInputs.throttle.value * thruster.getAuthority01(LocalDirection.BACKWARD));

                thruster.updateThrottle(2 * deltaTime * SpaceShipControlsInputs.upDown.value * thruster.getAuthority01(LocalDirection.UP));
                thruster.updateThrottle(2 * deltaTime * -SpaceShipControlsInputs.upDown.value * thruster.getAuthority01(LocalDirection.DOWN));

                /*thruster.updateThrottle(2 * deltaTime * input.getXAxis() * thruster.getAuthority01(LocalDirection.LEFT));
                thruster.updateThrottle(2 * deltaTime * -input.getXAxis() * thruster.getAuthority01(LocalDirection.RIGHT));*/
            }

            this.spaceship.aggregate.body.applyForce(
              getUpwardDirection(this.getTransform()).scale(9.8 * 10 * SpaceShipControlsInputs.upDown.value),
              this.spaceship.aggregate.body.getObjectCenterWorld()
            );

            if (SpaceShipControlsInputs.landing.state === "complete") {
                if (this.spaceship.getClosestWalkableObject() !== null) {
                    this.spaceship.engageLanding(null);
                }
            }

            for (const rcsThruster of this.spaceship.rcsThrusters) {
                let throttle = 0;

                // rcs rotation contribution
                if (inputRoll < 0 && rcsThruster.getRollAuthorityNormalized() > 0.2) throttle = Math.max(throttle, Math.abs(inputRoll));
                else if (inputRoll > 0 && rcsThruster.getRollAuthorityNormalized() < -0.2) throttle = Math.max(throttle, Math.abs(inputRoll));

                if (inputPitch < 0 && rcsThruster.getPitchAuthorityNormalized() > 0.2) throttle = Math.max(throttle, Math.abs(inputPitch));
                else if (inputPitch > 0 && rcsThruster.getPitchAuthorityNormalized() < -0.2) throttle = Math.max(throttle, Math.abs(inputPitch));

                rcsThruster.setThrottle(throttle);
            }
        } else {
            roll(this.getTransform(), inputRoll * deltaTime);
            pitch(this.getTransform(), inputPitch * deltaTime);

            this.spaceship.getWarpDrive().increaseTargetThrottle(deltaTime * SpaceShipControlsInputs.throttle.value);
        }

        // camera shake
        // this.thirdPersonCamera.alpha += (Math.random() - 0.5) / 500;
        // this.thirdPersonCamera.beta += (Math.random() - 0.5) / 500;

        this.getActiveCamera().getViewMatrix(true);

        return this.getTransform().getAbsolutePosition();
    }

    dispose() {
        this.spaceship.dispose();
        this.thirdPersonCamera.dispose();
        this.firstPersonCamera.dispose();
    }
}
