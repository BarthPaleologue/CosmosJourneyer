import Action from "@brianchirls/game-input/Action";
import { AxisComposite } from "@brianchirls/game-input/browser";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";

import { InputDevices } from "@/frontend/inputs/devices";
import { InputMap } from "@/frontend/inputs/inputMap";

const keyboard = InputDevices.KEYBOARD;
const pointer = InputDevices.POINTER;

const landingAction = new Action({
    bindings: [keyboard.getControl("KeyL")],
});

const landingInteraction = new PressInteraction(landingAction);

const emitLandingRequest = new PressInteraction(
    new Action({
        bindings: [keyboard.getControl("KeyY")],
    }),
);

const upDown = new AxisComposite({
    positive: keyboard.getControl("KeyR"),
    negative: keyboard.getControl("KeyF"),
});

const upDownAction = new Action({
    bindings: [upDown],
});

const throttle = new AxisComposite({
    positive: keyboard.getControl("KeyW"),
    negative: keyboard.getControl("KeyS"),
});

const throttleAction = new Action({
    bindings: [throttle],
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
        },
    ],
});

const toggleWarpDrive = new Action({
    bindings: [keyboard.getControl("KeyH")],
});

const toggleWarpDriveInteraction = new PressInteraction(toggleWarpDrive);

const ignorePointer = new Action({
    bindings: [keyboard.getControl("ShiftLeft")],
});

const throttleToZero = new Action({
    bindings: [keyboard.getControl("KeyX")],
});

const throttleToZeroInteraction = new PressInteraction(throttleToZero);

const previousMissionInteraction = new PressInteraction(
    new Action({
        bindings: [keyboard.getControl("Numpad1")],
    }),
);

const nextMissionInteraction = new PressInteraction(
    new Action({
        bindings: [keyboard.getControl("Numpad2")],
    }),
);

const resetCameraInteraction = new PressInteraction(
    new Action({
        bindings: [keyboard.getControl("Numpad0")],
    }),
);

export const SpaceShipControlsInputs = new InputMap<{
    landing: PressInteraction;
    emitLandingRequest: PressInteraction;
    upDown: Action;
    throttle: Action;
    rollPitch: Action<[number, number]>;
    toggleWarpDrive: PressInteraction;
    ignorePointer: Action;
    throttleToZero: PressInteraction;
    previousMission: PressInteraction;
    nextMission: PressInteraction;
    resetCamera: PressInteraction;
}>("SpaceShipInputs", {
    landing: landingInteraction,
    emitLandingRequest: emitLandingRequest,
    upDown: upDownAction,
    throttle: throttleAction,
    rollPitch: rollPitch,
    toggleWarpDrive: toggleWarpDriveInteraction,
    ignorePointer: ignorePointer,
    throttleToZero: throttleToZeroInteraction,
    previousMission: previousMissionInteraction,
    nextMission: nextMissionInteraction,
    resetCamera: resetCameraInteraction,
});

SpaceShipControlsInputs.setEnabled(false);
