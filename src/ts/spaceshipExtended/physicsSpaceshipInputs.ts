import Action from "@brianchirls/game-input/Action";
import { InputDevices } from "../inputs/devices";

const keyboard = InputDevices.KEYBOARD;

const upAction = new Action({
    bindings: [keyboard.getControl("Space")]
});

const forwardAction = new Action({
    bindings: [keyboard.getControl("KeyW")]
});

export const PhysicsSpaceShipControlsInputs = {
    up: upAction,
    forward: forwardAction
};
