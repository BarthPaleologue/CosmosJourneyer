import Gamepad from "@brianchirls/game-input/devices/Gamepad";
import Keyboard from "@brianchirls/game-input/devices/Keyboard";
import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";

const gamepad = new Gamepad();
const keyboard = new Keyboard({
    keyCode: true,
});

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
    bindings: [leftStick, kbdWASD]
});

const jumpKey = keyboard.getControl("Space");
const jumpButton = gamepad.getControl("A");

const jumpAction = new Action({
    bindings: [jumpKey, jumpButton]
});

const jumpInteraction = new PressInteraction(jumpAction);

export const CharacterInputs = {
    move: moveAction,
    jump: jumpInteraction
};

export const InputDevices = {
    gamepad: gamepad,
    keyboard: keyboard
};
