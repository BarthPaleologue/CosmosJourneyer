import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";
import { InputDevices } from "../input";
import { AxisComposite } from "@brianchirls/game-input/browser";

const gamepad = InputDevices.gamepad;
const keyboard = InputDevices.keyboard;

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

const keyboardSpeed = new AxisComposite({
  positive: keyboard.getControl('NumpadAdd'), // '+'
  negative: keyboard.getControl("NumpadSubtract") // '-'
});

const changeSpeedAction = new Action({
  bindings: [keyboardSpeed]
});

const upDown = new AxisComposite({
  positive: keyboard.getControl('Space'),
  negative: keyboard.getControl('ShiftLeft')
});

const upDownAction = new Action({
  bindings: [upDown]
});

const roll = new AxisComposite({
  positive: keyboard.getControl('KeyE'),
  negative: keyboard.getControl('KeyQ')
});

const rollAction = new Action({
  bindings: [roll]
});

const pitch = new AxisComposite({
  positive: keyboard.getControl('KeyK'),
  negative: keyboard.getControl('KeyI')
});

const pitchAction = new Action({
  bindings: [pitch]
});

const yaw = new AxisComposite({
  positive: keyboard.getControl('KeyJ'),
  negative: keyboard.getControl('KeyL'),
});

const yawAction = new Action({
  bindings: [yaw]
});

export const DefaultControlsInput = {
  move: moveAction,
  upDown: upDownAction,
  changeSpeed: changeSpeedAction,
  roll: rollAction,
  pitch: pitchAction,
  yaw: yawAction
};