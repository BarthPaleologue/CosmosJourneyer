import Gamepad from "@brianchirls/game-input/devices/Gamepad";
import Keyboard from "@brianchirls/game-input/devices/Keyboard";
import Pointer from "@brianchirls/game-input/devices/Pointer";

const gamepad = new Gamepad();
const keyboard = new Keyboard({
    keyCode: true
});
const pointer = new Pointer();

export const InputDevices = {
    GAMEPAD: gamepad,
    KEYBOARD: keyboard,
    POINTER: pointer
};

export function updateInputDevices() {
    gamepad.update();
}
