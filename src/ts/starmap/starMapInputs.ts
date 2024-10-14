import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";
import { InputMap } from "../inputs/inputMap";
import { InputDevices } from "../inputs/devices";
import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import { AxisComposite } from "@brianchirls/game-input/browser";

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

const keyboardSpeed = new AxisComposite({
    positive: keyboard.getControl("NumpadAdd"), // '+'
    negative: keyboard.getControl("NumpadSubtract") // '-'
});

const changeSpeedAction = new Action({
    bindings: [keyboardSpeed]
});

const upDown = new AxisComposite({
    positive: keyboard.getControl("Space"),
    negative: keyboard.getControl("ShiftLeft")
});

const upDownAction = new Action({
    bindings: [upDown]
});

export const StarMapInputs = new InputMap<{
    focusOnCurrentSystem: PressInteraction;
    move: Action<[number, number]>;
    changeSpeed: Action<number>;
    upDown: Action<number>;
}>("StarMapInputs", {
    focusOnCurrentSystem: focusOnCurrentSystemInteraction,
    move: moveAction,
    changeSpeed: changeSpeedAction,
    upDown: upDownAction
});
