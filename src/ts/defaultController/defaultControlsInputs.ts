import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import Action from "@brianchirls/game-input/Action";
import { InputDevices } from "../inputs/devices";
import { AxisComposite } from "@brianchirls/game-input/browser";
import { InputMap } from "../inputs/inputMap";
import { InputMaps } from "../inputs/inputMaps";

const gamepad = InputDevices.GAMEPAD;
const keyboard = InputDevices.KEYBOARD;

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

const roll = new AxisComposite({
    positive: keyboard.getControl("KeyE"),
    negative: keyboard.getControl("KeyQ")
});

const rollAction = new Action({
    bindings: [roll]
});

const pitch = new AxisComposite({
    positive: keyboard.getControl("KeyK"),
    negative: keyboard.getControl("KeyI")
});

const pitchAction = new Action({
    bindings: [pitch]
});

const yaw = new AxisComposite({
    positive: keyboard.getControl("KeyJ"),
    negative: keyboard.getControl("KeyL")
});

const yawAction = new Action({
    bindings: [yaw]
});

export const DefaultControlsInputs = new InputMap<{
    move: Action<[number, number]>;
    upDown: Action<number>;
    changeSpeed: Action<number>;
    roll: Action<number>;
    pitch: Action<number>;
    yaw: Action<number>;
}>("DefaultControlsInputs", {
    move: moveAction,
    upDown: upDownAction,
    changeSpeed: changeSpeedAction,
    roll: rollAction,
    pitch: pitchAction,
    yaw: yawAction
});

InputMaps.push(DefaultControlsInputs);