import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";
import { InputDevices } from "../inputs/devices";
import { InputMap } from "../inputs/inputMap";

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

const jumpKey = keyboard.getControl("Space");
const jumpButton = gamepad.getControl("A");

const jumpAction = new Action({
    bindings: [jumpKey, jumpButton]
});

const jumpInteraction = new PressInteraction(jumpAction);

const sambaKey = keyboard.getControl("KeyX");
const sambaButton = gamepad.getControl("X");

const sambaAction = new Action({
    bindings: [sambaKey, sambaButton]
});

const runKey = keyboard.getControl("ShiftLeft");
const runButton = gamepad.getControl("B");

const runAction = new Action({
    bindings: [runKey, runButton]
});

export const CharacterInputs = new InputMap<{
    move: Action<[number, number]>;
    jump: PressInteraction;
    samba: Action<number>;
    run: Action<number>;
}>("CharacterInputs", {
    move: moveAction,
    jump: jumpInteraction,
    samba: sambaAction,
    run: runAction
});
