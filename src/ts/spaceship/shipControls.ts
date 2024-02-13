//  This file is part of CosmosJourneyer
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
import { Input, InputType } from "../inputs/input";
import { Keyboard } from "../inputs/keyboard";
import { Mouse } from "../inputs/mouse";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Spaceship } from "./spaceship";

export class ShipControls implements Controls {
    readonly spaceship: Spaceship;

    readonly thirdPersonCamera: ArcRotateCamera;
    readonly firstPersonCamera: FreeCamera;

    private inputs: Input[] = [];

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
    }

    public addInput(input: Input): void {
        this.inputs.push(input);
        if (input.type === InputType.KEYBOARD) {
            const keyboard = input as Keyboard;
            keyboard.addPressedOnceListener("f", () => {
                this.spaceship.setFlightAssistEnabled(!this.spaceship.getFlightAssistEnabled());
            });
            keyboard.addPressedOnceListener("h", () => {
                this.spaceship.toggleWarpDrive();
            });
        }
    }
    public getTransform(): TransformNode {
        return this.spaceship.getTransform();
    }

    public getActiveCamera(): Camera {
        return this.thirdPersonCamera;
    }

    private listenTo(input: Input, deltaTime: number) {
        if (this.spaceship.getWarpDrive().isDisabled()) {
            for (const thruster of this.spaceship.mainThrusters) {
                thruster.updateThrottle(2 * deltaTime * input.getZAxis() * thruster.getAuthority01(LocalDirection.FORWARD));
                thruster.updateThrottle(2 * deltaTime * -input.getZAxis() * thruster.getAuthority01(LocalDirection.BACKWARD));

                thruster.updateThrottle(2 * deltaTime * input.getYAxis() * thruster.getAuthority01(LocalDirection.UP));
                thruster.updateThrottle(2 * deltaTime * -input.getYAxis() * thruster.getAuthority01(LocalDirection.DOWN));

                thruster.updateThrottle(2 * deltaTime * input.getXAxis() * thruster.getAuthority01(LocalDirection.LEFT));
                thruster.updateThrottle(2 * deltaTime * -input.getXAxis() * thruster.getAuthority01(LocalDirection.RIGHT));
            }

            if (input.type === InputType.KEYBOARD) {
                const keyboard = input as Keyboard;
                if (keyboard.isPressed("r")) {
                    this.spaceship.aggregate.body.applyForce(getUpwardDirection(this.getTransform()).scale(9.8 * 10), this.spaceship.aggregate.body.getObjectCenterWorld());
                }

                if (keyboard.isPressed("l")) {
                    if (this.spaceship.getClosestWalkableObject() === null) return;
                    this.spaceship.engageLanding(null);
                }
            }

            if (input.type === InputType.MOUSE) {
                const mouse = input as Mouse;
                const roll = mouse.getRoll();
                const pitch = mouse.getPitch();

                for (const rcsThruster of this.spaceship.rcsThrusters) {
                    let throttle = 0;

                    // rcs rotation contribution
                    if (roll < 0 && rcsThruster.getRollAuthorityNormalized() > 0.2) throttle = Math.max(throttle, Math.abs(roll));
                    else if (roll > 0 && rcsThruster.getRollAuthorityNormalized() < -0.2) throttle = Math.max(throttle, Math.abs(roll));

                    if (pitch < 0 && rcsThruster.getPitchAuthorityNormalized() > 0.2) throttle = Math.max(throttle, Math.abs(pitch));
                    else if (pitch > 0 && rcsThruster.getPitchAuthorityNormalized() < -0.2) throttle = Math.max(throttle, Math.abs(pitch));

                    rcsThruster.setThrottle(throttle);
                }

                mouse.reset();
            }
        } else {
            if (input.type === InputType.MOUSE) {
                const mouse = input as Mouse;
                const rollContribution = mouse.getRoll();
                const pitchContribution = mouse.getPitch();

                roll(this.getTransform(), rollContribution * deltaTime);
                pitch(this.getTransform(), pitchContribution * deltaTime);

                mouse.reset();
            }

            if (input.type === InputType.KEYBOARD) {
                const keyboard = input as Keyboard;
                const deltaThrottle = keyboard.getZAxis() * deltaTime;
                this.spaceship.getWarpDrive().increaseTargetThrottle(deltaThrottle);
            }
        }
    }

    public update(deltaTime: number): Vector3 {
        this.spaceship.update(deltaTime);

        for (const input of this.inputs) this.listenTo(input, deltaTime);

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
