import Action from "@brianchirls/game-input/Action";
import { AxisComposite } from "@brianchirls/game-input/browser";
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

const jumpAction = new Action({
    bindings: [keyboard.getControl("Space")],
});

const jumpInteraction = new PressInteraction(jumpAction);

const swimVerticalAxis = new AxisComposite({
    positive: keyboard.getControl("Space"),
    negative: keyboard.getControl("ShiftLeft"),
});

const swimVerticalAction = new Action({
    bindings: [swimVerticalAxis],
});

const danceKey = keyboard.getControl("KeyX");
const danceInteraction = new PressInteraction(
    new Action({
        bindings: [danceKey],
    }),
);

const sitOnGroundInteraction = new PressInteraction(
    new Action({
        bindings: [keyboard.getControl("KeyZ")],
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
    sitOnGround: PressInteraction;
    run: Action;
    toggleCamera: PressInteraction;
    swimVertical: Action;
}>("CharacterInputs", {
    move: moveAction,
    jump: jumpInteraction,
    dance: danceInteraction,
    sitOnGround: sitOnGroundInteraction,
    run: runAction,
    toggleCamera: toggleCameraInteraction,
    swimVertical: swimVerticalAction,
});

CharacterInputs.setEnabled(false);
