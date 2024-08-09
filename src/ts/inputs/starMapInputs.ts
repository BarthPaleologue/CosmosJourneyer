import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";
import { InputMap } from "./inputMap";
import { InputDevices } from "./devices";
import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";

const gamepad = InputDevices.GAMEPAD;
const keyboard = InputDevices.KEYBOARD;

const focusOnCurrentSystemAction = new Action({
    bindings: [keyboard.getControl("KeyF")]
});

const focusOnCurrentSystemInteraction = new PressInteraction(focusOnCurrentSystemAction);


const leftStick = gamepad.getControl("leftStick");

// It takes four keys to go in four directions
const kbdWASD = new DPadComposite({
    up: keyboard.getControl("KeyW"),
    left: keyboard.getControl("KeyA"),
    down: keyboard.getControl("KeyS"),
    right: keyboard.getControl("KeyD")
});

/**
 * Combine controls into actions.
 * The action will respond to whichever control is used.
 */
const moveAction = new Action({
    bindings: [kbdWASD, leftStick]
});

export const StarMapInputs = new InputMap<{
    focusOnCurrentSystem: PressInteraction;
    move: Action<[number, number]>;
}>("StarMapInputs", {
    focusOnCurrentSystem: focusOnCurrentSystemInteraction,
    move: moveAction
});
