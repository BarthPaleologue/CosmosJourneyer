import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";

import { InputDevices } from "./devices";
import { InputMap } from "./inputMap";

const keyboard = InputDevices.KEYBOARD;

const togglePauseKey = keyboard.getControl("Escape");

const togglePauseAction = new Action({
    bindings: [togglePauseKey],
});

const togglePauseInteraction = new PressInteraction(togglePauseAction);

const toggleStarMapKey = keyboard.getControl("KeyM");

const toggleStarMapAction = new Action({
    bindings: [toggleStarMapKey],
});

const toggleStarMapInteraction = new PressInteraction(toggleStarMapAction);

const screenshotKey = keyboard.getControl("KeyP");

const screenshotAction = new Action({
    bindings: [screenshotKey],
});

const screenshotInteraction = new PressInteraction(screenshotAction);

const videoCaptureKey = keyboard.getControl("KeyV");

const videoCaptureAction = new Action({
    bindings: [videoCaptureKey],
});

const videoCaptureInteraction = new PressInteraction(videoCaptureAction);

export const GeneralInputs = new InputMap<{
    togglePause: PressInteraction;
    toggleStarMap: PressInteraction;
    screenshot: PressInteraction;
    videoCapture: PressInteraction;
}>("GeneralInputs", {
    togglePause: togglePauseInteraction,
    toggleStarMap: toggleStarMapInteraction,
    screenshot: screenshotInteraction,
    videoCapture: videoCaptureInteraction,
});
