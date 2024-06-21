import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";
import { InputDevices } from "../inputs/devices";
import { AxisComposite } from "@brianchirls/game-input/browser";
import { InputMap } from "../inputs/inputMap";

const gamepad = InputDevices.GAMEPAD;
const keyboard = InputDevices.KEYBOARD;
const pointer = InputDevices.POINTER;

const landingAction = new Action({
    bindings: [keyboard.getControl("KeyL"), gamepad.getControl("A")]
});

const landingInteraction = new PressInteraction(landingAction);

const emitDockingRequest = new PressInteraction(new Action({
    bindings: [keyboard.getControl("keyY")]
}));

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

const rollPitch = new Action({
    bindings: [pointer.getControl("position")],
    processors: [
        (value: [number, number]): [number, number] => {
            let [pointerX, pointerY] = value;

            // to range [0, 1]
            pointerX /= window.innerWidth;
            pointerY /= window.innerHeight;

            // to range [-1, 1]
            pointerX = pointerX * 2 - 1;
            pointerY = pointerY * 2 - 1;

            // normalize
            pointerX *= window.innerWidth / Math.max(window.innerWidth, window.innerHeight);
            pointerY *= window.innerHeight / Math.max(window.innerWidth, window.innerHeight);

            // dead zone
            const deadZone = 0.1;

            pointerX = Math.sign(pointerX) * Math.max(0, Math.abs(pointerX) - deadZone) ** 2;
            pointerY = Math.sign(pointerY) * Math.max(0, Math.abs(pointerY) - deadZone) ** 2;

            return [pointerX, pointerY];
        }
    ]
});

const toggleWarpDrive = new Action({
    bindings: [keyboard.getControl("KeyH")]
});

const toggleWarpDriveInteraction = new PressInteraction(toggleWarpDrive);

const ignorePointer = new Action({
    bindings: [keyboard.getControl("AltLeft")]
});

const throttleToZero = new Action({
    bindings: [keyboard.getControl("KeyX")]
});

const throttleToZeroInteraction = new PressInteraction(throttleToZero);

export const SpaceShipControlsInputs = new InputMap<{
    landing: PressInteraction;
    emitDockingRequest: PressInteraction;
    upDown: Action<number>;
    throttle: Action<number>;
    rollPitch: Action<[number, number]>;
    toggleWarpDrive: PressInteraction;
    ignorePointer: Action<number>;
    throttleToZero: PressInteraction;
}>("SpaceShipInputs", {
    landing: landingInteraction,
    emitDockingRequest: emitDockingRequest,
    upDown: upDownAction,
    throttle: throttleAction,
    rollPitch: rollPitch,
    toggleWarpDrive: toggleWarpDriveInteraction,
    ignorePointer: ignorePointer,
    throttleToZero: throttleToZeroInteraction
});

SpaceShipControlsInputs.setEnabled(false);
