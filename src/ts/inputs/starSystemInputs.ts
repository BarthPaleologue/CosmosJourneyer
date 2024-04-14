import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";
import Action from "@brianchirls/game-input/Action";
import { InputMap } from "./inputMap";
import { InputDevices } from "./devices";

const gamepad = InputDevices.GAMEPAD;
const keyboard = InputDevices.KEYBOARD;

const setTargetAction = new Action({
    bindings: [keyboard.getControl("KeyT")]
});

const setTargetInteraction = new PressInteraction(setTargetAction);

const toggleSpaceShipCharacterAction = new Action({
    bindings: [keyboard.getControl("KeyE")]
});

const toggleSpaceShipCharacterInteraction = new PressInteraction(toggleSpaceShipCharacterAction);

const jumpToSystemAction = new Action({
    bindings: [keyboard.getControl("KeyJ")]
});

const jumpToSystemInteraction = new PressInteraction(jumpToSystemAction);

const toggleOverlayAction = new Action({
    bindings: [keyboard.getControl("KeyO")]
});

const toggleOverlayInteraction = new PressInteraction(toggleOverlayAction);

const toggleOrbitsAndAxisAction = new Action({
    bindings: [keyboard.getControl("KeyN")]
});

const toggleOrbitsAndAxisInteraction = new PressInteraction(toggleOrbitsAndAxisAction);

const toggleDebugUiAction = new Action({
    bindings: [keyboard.getControl("KeyU")]
});

const toggleDebugUiInteraction = new PressInteraction(toggleDebugUiAction);

const cycleViewsAction = new Action({
    bindings: [keyboard.getControl("KeyC")]
});

const cycleViewsInteraction = new PressInteraction(cycleViewsAction);

export const StarSystemInputs = new InputMap<{
    setTarget: PressInteraction;
    toggleSpaceShipCharacter: PressInteraction;
    jumpToSystem: PressInteraction;
    toggleOverlay: PressInteraction;
    toggleOrbitsAndAxis: PressInteraction;
    cycleViews: PressInteraction;
    toggleDebugUi: PressInteraction;
}>("StarSystemInputs", {
    setTarget: setTargetInteraction,
    toggleSpaceShipCharacter: toggleSpaceShipCharacterInteraction,
    jumpToSystem: jumpToSystemInteraction,
    toggleOverlay: toggleOverlayInteraction,
    toggleOrbitsAndAxis: toggleOrbitsAndAxisInteraction,
    cycleViews: cycleViewsInteraction,
    toggleDebugUi: toggleDebugUiInteraction
});
