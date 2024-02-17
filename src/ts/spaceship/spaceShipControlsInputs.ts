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
    bindings: [keyboard.getControl("KeyH")]
});

const toggleWarpDriveInteraction = new PressInteraction(toggleWarpDrive);

export const SpaceShipControlsInputs = {
    landing: landingInteraction,
    upDown: upDownAction,
    throttle: throttleAction,
    rollPitch: rollPitch,
    toggleFlightAssist: toggleFlightAssistInteraction,
    toggleWarpDrive: toggleWarpDriveInteraction
};
