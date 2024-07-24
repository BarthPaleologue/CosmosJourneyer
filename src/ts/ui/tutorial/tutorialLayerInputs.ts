import Action from "@brianchirls/game-input/Action";
import { InputDevices } from "../../inputs/devices";
import { InputMap } from "../../inputs/inputMap";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";

const keyboard = InputDevices.KEYBOARD;

const nextPanel = new PressInteraction(new Action({
    bindings: [keyboard.getControl("keyReturn")]
}));

const prevPanel = new PressInteraction(new Action({
    bindings: [keyboard.getControl("keyBackspace")]
}));

const quitTutorial = new PressInteraction(new Action({
    bindings: [keyboard.getControl("keyEscape")]
}));

export const TutorialControlsInputs = new InputMap<{
    nextPanel: PressInteraction;
    prevPanel: PressInteraction;
    quitTutorial: PressInteraction;
}>("TutorialControls", {
    nextPanel,
    prevPanel,
    quitTutorial
});
