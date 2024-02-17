import Gamepad from "@brianchirls/game-input/devices/Gamepad";
import Keyboard from "@brianchirls/game-input/devices/Keyboard";
import Pointer from "@brianchirls/game-input/devices/Pointer";

const gamepad = new Gamepad();
const keyboard = new Keyboard({
    keyCode: true,
});
const pointer = new Pointer();

export const InputDevices = {
    gamepad: gamepad,
    keyboard: keyboard,
    pointer: pointer
};

export function updateInputDevices() {
    gamepad.update();
}