import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";

import { InputDevices } from "@/frontend/inputs/devices";
import { InputMap } from "@/frontend/inputs/inputMap";

const keyboard = InputDevices.KEYBOARD;

const nextPanel = new PressInteraction(
    new Action({
        bindings: [keyboard.getControl("Space")],
    }),
);

const prevPanel = new PressInteraction(
    new Action({
        bindings: [keyboard.getControl("Backspace")],
    }),
);

export const TutorialControlsInputs = new InputMap<{
    nextPanel: PressInteraction;
    prevPanel: PressInteraction;
}>("TutorialControls", {
    nextPanel,
    prevPanel,
});

TutorialControlsInputs.setEnabled(false);
