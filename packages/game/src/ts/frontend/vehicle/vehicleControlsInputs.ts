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

import Action from "@brianchirls/game-input/Action";
import { AxisComposite } from "@brianchirls/game-input/browser";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";

import { InputDevices } from "@/frontend/inputs/devices";
import { InputMap } from "@/frontend/inputs/inputMap";

const keyboard = InputDevices.KEYBOARD;

const accelerateAction = new Action({
    bindings: [
        new AxisComposite({
            positive: keyboard.getControl("KeyW"),
            negative: keyboard.getControl("KeyS"),
        }),
    ],
});

const steerAction = new Action({
    bindings: [
        new AxisComposite({
            positive: keyboard.getControl("KeyD"),
            negative: keyboard.getControl("KeyA"),
        }),
    ],
});

const brakeAction = new Action({
    bindings: [keyboard.getControl("Space")],
});

const toggleCameraAction = new Action({
    bindings: [keyboard.getControl("KeyB")],
});

export const VehicleInputs = new InputMap<{
    accelerate: Action;
    steer: Action;
    brake: Action;
    toggleCamera: PressInteraction;
}>("VehicleInputs", {
    accelerate: accelerateAction,
    steer: steerAction,
    brake: brakeAction,
    toggleCamera: new PressInteraction(toggleCameraAction),
});

VehicleInputs.setEnabled(false);
