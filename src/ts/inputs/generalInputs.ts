import { InputMap } from "./inputMap";
import { InputDevices } from "./devices";
import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";

const gamepad = InputDevices.GAMEPAD;
const keyboard = InputDevices.KEYBOARD;

const togglePauseKey = keyboard.getControl("Escape");
const togglePauseButton = gamepad.getControl("start");

const togglePauseAction = new Action({
    bindings: [togglePauseKey, togglePauseButton]
});

const togglePauseInteraction = new PressInteraction(togglePauseAction);

const toggleStarMapKey = keyboard.getControl("KeyM");

const toggleStarMapAction = new Action({
    bindings: [toggleStarMapKey]
});

const toggleStarMapInteraction = new PressInteraction(toggleStarMapAction);

const screenshotKey = keyboard.getControl("KeyP");
const screenshotButton = gamepad.getControl("select");

const screenshotAction = new Action({
    bindings: [screenshotKey, screenshotButton]
});

const screenshotInteraction = new PressInteraction(screenshotAction);

const videoCaptureKey = keyboard.getControl("KeyV");

const videoCaptureAction = new Action({
    bindings: [videoCaptureKey]
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
    videoCapture: videoCaptureInteraction
});
