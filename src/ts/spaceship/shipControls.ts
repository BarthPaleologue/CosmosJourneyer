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

        // pointer position
        let [pointerX, pointerY] = SpaceShipControlsInputs.pointerPosition.value;

        // to range [0, 1]
        pointerX /= window.innerWidth;
        pointerY /= window.innerHeight;

        // to range [-1, 1]
        pointerX = pointerX * 2 - 1;
        pointerY = pointerY * 2 - 1;

        // dead area and logarithmic scale
        pointerX = Math.sign(pointerX) * Math.max(0, Math.log(0.9 + Math.abs(pointerX)));
        pointerY = Math.sign(pointerY) * Math.max(0, Math.log(0.9 + Math.abs(pointerY)));

        /*if(SpaceShipControlsInputs.toggleFlightAssist.state === "complete") {
            console.log("!");
            this.spaceship.setFlightAssistEnabled(!this.spaceship.getFlightAssistEnabled());
        }*/

        if (this.spaceship.getWarpDrive().isDisabled()) {
            for (const thruster of this.spaceship.mainThrusters) {
                thruster.updateThrottle(2 * deltaTime * SpaceShipControlsInputs.throttle.value * thruster.getAuthority01(LocalDirection.FORWARD));
                thruster.updateThrottle(2 * deltaTime * -SpaceShipControlsInputs.throttle.value * thruster.getAuthority01(LocalDirection.BACKWARD));

                /*thruster.updateThrottle(2 * deltaTime * input.getYAxis() * thruster.getAuthority01(LocalDirection.UP));
                thruster.updateThrottle(2 * deltaTime * -input.getYAxis() * thruster.getAuthority01(LocalDirection.DOWN));

                thruster.updateThrottle(2 * deltaTime * input.getXAxis() * thruster.getAuthority01(LocalDirection.LEFT));
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
                if (pointerX < 0 && rcsThruster.getRollAuthorityNormalized() > 0.2) throttle = Math.max(throttle, Math.abs(pointerX));
                else if (pointerX > 0 && rcsThruster.getRollAuthorityNormalized() < -0.2) throttle = Math.max(throttle, Math.abs(pointerX));

                if (pointerY < 0 && rcsThruster.getPitchAuthorityNormalized() > 0.2) throttle = Math.max(throttle, Math.abs(pointerY));
                else if (pointerY > 0 && rcsThruster.getPitchAuthorityNormalized() < -0.2) throttle = Math.max(throttle, Math.abs(pointerY));

                rcsThruster.setThrottle(throttle);
            }
        } else {
            roll(this.getTransform(), pointerX * deltaTime);
            pitch(this.getTransform(), pointerY * deltaTime);

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
