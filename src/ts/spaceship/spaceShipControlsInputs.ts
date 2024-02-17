import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";
import { InputDevices } from "../input";
import { AxisComposite } from "@brianchirls/game-input/browser";

const gamepad = InputDevices.gamepad;
const keyboard = InputDevices.keyboard;
const pointer = InputDevices.pointer;

const landingAction = new Action({
    bindings: [keyboard.getControl("Space"), gamepad.getControl("A")]
});

const landingInteraction = new PressInteraction(landingAction);

const upDown = new AxisComposite({
    positive: keyboard.getControl("KeyR"),
    negative: keyboard.getControl("KeyF")
});

const upDownAction = new Action({
    bindings: [upDown]
});

const throttle = new AxisComposite({
    positive: keyboard.getControl("KeyW"),
    negative: keyboard.getControl("KeyS")
});

const throttleAction = new Action({
    bindings: [throttle]
});

const pointerPosition = new Action({
    bindings: [pointer.getControl("position")]
});

const toggleFlightAssist = new Action({
    bindings: [keyboard.getControl("KeyF")]
});

const toggleFlightAssistInteraction = new PressInteraction(toggleFlightAssist);

const toggleWarpDrive = new Action({
    bindings: [keyboard.getControl("KeyH")]
});

const toggleWarpDriveInteraction = new PressInteraction(toggleWarpDrive);

export const SpaceShipControlsInputs = {
    landing: landingInteraction,
    upDown: upDownAction,
    throttle: throttleAction,
    pointerPosition: pointerPosition,
    toggleFlightAssist: toggleFlightAssistInteraction,
    toggleWarpDrive: toggleWarpDriveInteraction
};
