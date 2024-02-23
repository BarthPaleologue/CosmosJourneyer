import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";
import { InputDevices } from "../inputs/devices";
import { AxisComposite } from "@brianchirls/game-input/browser";
import { InputMaps } from "../inputs/inputMaps";
import { InputMap } from "../inputs/inputMap";

const gamepad = InputDevices.GAMEPAD;
const keyboard = InputDevices.KEYBOARD;
const pointer = InputDevices.POINTER;

const landingAction = new Action({
    bindings: [keyboard.getControl("KeyL"), gamepad.getControl("A")]
});

const landingInteraction = new PressInteraction(landingAction);

const upDown = new AxisComposite({
    positive: keyboard.getControl("KeyR"),
    negative: keyboard.getControl("KeyF")
});

const upDownAction = new Action({
    bindings: [upDown],
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
            if (Math.abs(pointerX) < deadZone) {
                pointerX = 0;
            }
            if (Math.abs(pointerY) < deadZone) {
                pointerY = 0;
            }

            // logarithmic scale
            pointerX = Math.sign(pointerX) * Math.log(1 + Math.abs(pointerX));
            pointerY = Math.sign(pointerY) * Math.log(1 + Math.abs(pointerY));

            return [pointerX, pointerY];
        }
    ]
});

const toggleFlightAssist = new Action({
    bindings: [keyboard.getControl("KeyF")]
});

const toggleFlightAssistInteraction = new PressInteraction(toggleFlightAssist);

const toggleWarpDrive = new Action({
    bindings: [keyboard.getControl("KeyH")],
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
    landing: PressInteraction,
    upDown: Action<number>,
    throttle: Action<number>,
    rollPitch: Action<[number, number]>,
    toggleFlightAssist: PressInteraction,
    toggleWarpDrive: PressInteraction,
    ignorePointer: Action<number>,
    throttleToZero: PressInteraction
}>("SpaceShipInputs", {
    landing: landingInteraction,
    upDown: upDownAction,
    throttle: throttleAction,
    rollPitch: rollPitch,
    toggleFlightAssist: toggleFlightAssistInteraction,
    toggleWarpDrive: toggleWarpDriveInteraction,
    ignorePointer: ignorePointer,
    throttleToZero: throttleToZeroInteraction
});

InputMaps.push(SpaceShipControlsInputs);