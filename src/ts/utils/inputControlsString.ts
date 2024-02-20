import {
    AxisComposite,
    ButtonInputControl,
    StickInputControl,
    Vector2InputControl
} from "@brianchirls/game-input/browser";
import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";

export function stickInputToString(input: StickInputControl): [string, string][] {
    const keys: [string, string][] = [];
    input.children.forEach((child, key) => {
        if (key === "x" || key === "y") return;
        keys.push([key, input.name]);
    });
    return keys;
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

export function vector2ToString(input: Vector2InputControl): [string, string][] {
    return [["x", "pointerX"], ["y", "pointerY"]];
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
