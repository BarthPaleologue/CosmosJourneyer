import Action from "@brianchirls/game-input/Action";
import { AxisComposite } from "@brianchirls/game-input/browser";
import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";

import { InputDevices } from "@/frontend/inputs/devices";
import { InputMap } from "@/frontend/inputs/inputMap";

const keyboard = InputDevices.KEYBOARD;

const focusOnCurrentSystemAction = new Action({
    bindings: [keyboard.getControl("KeyF")],
});

const focusOnCurrentSystemInteraction = new PressInteraction(focusOnCurrentSystemAction);

// It takes four keys to go in four directions
const kbdWASD = new DPadComposite({
    up: keyboard.getControl("KeyW"),
    left: keyboard.getControl("KeyA"),
    down: keyboard.getControl("KeyS"),
    right: keyboard.getControl("KeyD"),
});

/**
 * Combine controls into actions.
 * The action will respond to whichever control is used.
 */
const moveAction = new Action({
    bindings: [kbdWASD],
});

const keyboardSpeed = new AxisComposite({
    positive: keyboard.getControl("NumpadAdd"), // '+'
    negative: keyboard.getControl("NumpadSubtract"), // '-'
});

const changeSpeedAction = new Action({
    bindings: [keyboardSpeed],
});

const upDown = new AxisComposite({
    positive: keyboard.getControl("Space"),
    negative: keyboard.getControl("ShiftLeft"),
});

const upDownAction = new Action({
    bindings: [upDown],
});

export const StarMapInputs = new InputMap<{
    focusOnCurrentSystem: PressInteraction;
    move: Action<[number, number]>;
    changeSpeed: Action;
    upDown: Action;
}>("StarMapInputs", {
    focusOnCurrentSystem: focusOnCurrentSystemInteraction,
    move: moveAction,
    changeSpeed: changeSpeedAction,
    upDown: upDownAction,
});
