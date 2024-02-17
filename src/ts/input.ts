import Gamepad from "@brianchirls/game-input/devices/Gamepad";
import Keyboard from "@brianchirls/game-input/devices/Keyboard";

const gamepad = new Gamepad();
const keyboard = new Keyboard({
    keyCode: true,
});

export const InputDevices = {
    gamepad: gamepad,
    keyboard: keyboard
};
