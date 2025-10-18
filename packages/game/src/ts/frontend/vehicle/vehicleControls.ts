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

import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import type { Scene } from "@babylonjs/core/scene";

import type { Vehicle } from "./vehicle";

export class VehicleControls {
    private vehicle: Vehicle | null = null;

    constructor(scene: Scene) {
        let forwardPressed = false;
        let backPressed = false;
        let leftPressed = false;
        let rightPressed = false;
        let brakePressed = false;

        scene.onKeyboardObservable.add((e) => {
            switch (e.event.key) {
                case "z":
                    forwardPressed = e.type === KeyboardEventTypes.KEYDOWN ? true : false;
                    break;
                case "s":
                    backPressed = e.type === KeyboardEventTypes.KEYDOWN ? true : false;
                    break;
                case "q":
                    leftPressed = e.type === KeyboardEventTypes.KEYDOWN ? true : false;
                    break;
                case "d":
                    rightPressed = e.type === KeyboardEventTypes.KEYDOWN ? true : false;
                    break;
                case " ":
                    brakePressed = e.type === KeyboardEventTypes.KEYDOWN ? true : false;
                    break;
            }
        });

        scene.onBeforeRenderObservable.add(() => {
            const vehicle = this.getVehicle();
            if (vehicle === null) {
                return;
            }

            let turnAngle = 0;
            if (rightPressed) {
                turnAngle = 0.03;
            } else if (leftPressed) {
                turnAngle = -0.03;
            }

            vehicle.turn(turnAngle);

            if (brakePressed) {
                vehicle.brake();
            } else {
                const vehicleMaxAcceleration = 8;
                let vehicleAcceleration = 0;
                if (forwardPressed) {
                    vehicleAcceleration = vehicleMaxAcceleration;
                } else if (backPressed) {
                    vehicleAcceleration = -vehicleMaxAcceleration;
                }

                vehicle.accelerate(vehicleAcceleration);
            }
        });
    }

    setVehicle(vehicle: Vehicle) {
        this.vehicle = vehicle;
    }

    getVehicle() {
        return this.vehicle;
    }
}
