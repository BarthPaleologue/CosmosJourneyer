import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";
import { InputMap } from "./inputMap";
import { InputDevices } from "./devices";

const gamepad = InputDevices.GAMEPAD;
const keyboard = InputDevices.KEYBOARD;

const focusOnCurrentSystemAction = new Action({
    bindings: [keyboard.getControl("KeyF")]
});

const focusOnCurrentSystemInteraction = new PressInteraction(focusOnCurrentSystemAction);

export const StarMapInputs = new InputMap<{
    focusOnCurrentSystem: PressInteraction;
}>("StarMapInputs", {
    focusOnCurrentSystem: focusOnCurrentSystemInteraction
});
