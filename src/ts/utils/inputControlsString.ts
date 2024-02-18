import { AxisComposite, ButtonInputControl, StickInputControl } from "@brianchirls/game-input/browser";
import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import Keyboard from "@brianchirls/game-input/devices/Keyboard";

export function stickInputToString(input: StickInputControl): string {
    return input.name;
}

export function dPadCompositeToString(input: DPadComposite): [string, string][] {
    const keys: [string, string][] = [];
    input.children.forEach((child, key) => {
        if (key === "x" || key === "y") return;
        let name = child.name;
        // remove the "key:" prefix
        name = name.replace("key:", "");
        // remove the occasional Key
        name = name.replace("Key", "");
        keys.push([key, name]);
    });
    return keys;
}

export function buttonInputToString(input: ButtonInputControl): string {
    let name = input.name;
    // remove the "key:" prefix
    name = name.replace("key:", "");
    // remove the occasional Key
    name = name.replace("Key", "");
    return name;
}

export function axisCompositeToString(input: AxisComposite): [string, string][] {
    const keys: [string, string][] = [];
    input.children.forEach((child, key) => {
        let name = child.name;

        // remove the "key:" prefix
        name = name.replace("key:", "");
        // remove the occasional Key
        name = name.replace("Key", "");
        keys.push([key, name]);
    });
    return keys;
}
