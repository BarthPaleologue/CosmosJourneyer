import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";

import { InputDevices } from "./devices";
import { InputMap } from "./inputMap";

const keyboard = InputDevices.KEYBOARD;

const setTargetAction = new Action({
    bindings: [keyboard.getControl("KeyT")],
});

const setTargetInteraction = new PressInteraction(setTargetAction);

const toggleSpaceShipCharacterAction = new Action({
    bindings: [keyboard.getControl("KeyE")],
});

const toggleSpaceShipCharacterInteraction = new PressInteraction(toggleSpaceShipCharacterAction);

const jumpToSystemAction = new Action({
    bindings: [keyboard.getControl("KeyJ")],
});

const jumpToSystemInteraction = new PressInteraction(jumpToSystemAction);

const toggleUiAction = new Action({
    bindings: [keyboard.getControl("KeyU")],
});

const toggleUiInteraction = new PressInteraction(toggleUiAction);

const toggleOrbitsAndAxisAction = new Action({
    bindings: [keyboard.getControl("KeyO")],
});

const toggleOrbitsAndAxisInteraction = new PressInteraction(toggleOrbitsAndAxisAction);

const cycleViewsAction = new Action({
    bindings: [keyboard.getControl("KeyC")],
});

const cycleViewsInteraction = new PressInteraction(cycleViewsAction);

const printDebugInfoInteraction = new PressInteraction(
    new Action({
        bindings: [keyboard.getControl("Numpad0")],
    }),
);

export const StarSystemInputs = new InputMap<{
    setTarget: PressInteraction;
    toggleSpaceShipCharacter: PressInteraction;
    jumpToSystem: PressInteraction;
    toggleUi: PressInteraction;
    toggleOrbitsAndAxis: PressInteraction;
    cycleViews: PressInteraction;
    printDebugInfo: PressInteraction;
}>("StarSystemInputs", {
    setTarget: setTargetInteraction,
    toggleSpaceShipCharacter: toggleSpaceShipCharacterInteraction,
    jumpToSystem: jumpToSystemInteraction,
    toggleUi: toggleUiInteraction,
    toggleOrbitsAndAxis: toggleOrbitsAndAxisInteraction,
    cycleViews: cycleViewsInteraction,
    printDebugInfo: printDebugInfoInteraction,
});
