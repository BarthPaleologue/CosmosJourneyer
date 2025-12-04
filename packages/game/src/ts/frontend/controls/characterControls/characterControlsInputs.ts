import Action from "@brianchirls/game-input/Action";
import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";

import { InputDevices } from "@/frontend/inputs/devices";
import { InputMap } from "@/frontend/inputs/inputMap";

const keyboard = InputDevices.KEYBOARD;

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

const jumpKey = keyboard.getControl("Space");

const jumpAction = new Action({
    bindings: [jumpKey],
});

const jumpInteraction = new PressInteraction(jumpAction);

const danceKey = keyboard.getControl("KeyX");
const danceInteraction = new PressInteraction(
    new Action({
        bindings: [danceKey],
    }),
);

const runKey = keyboard.getControl("ShiftLeft");
const runAction = new Action({
    bindings: [runKey],
});

const toggleCameraInteraction = new PressInteraction(
    new Action({
        bindings: [keyboard.getControl("KeyB")],
    }),
);

export const CharacterInputs = new InputMap<{
    move: Action<[number, number]>;
    jump: PressInteraction;
    dance: PressInteraction;
    run: Action;
    toggleCamera: PressInteraction;
}>("CharacterInputs", {
    move: moveAction,
    jump: jumpInteraction,
    dance: danceInteraction,
    run: runAction,
    toggleCamera: toggleCameraInteraction,
});

CharacterInputs.setEnabled(false);
