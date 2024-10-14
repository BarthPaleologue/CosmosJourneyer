import { AxisComposite, ButtonInputControl, StickInputControl, Vector2InputControl } from "@brianchirls/game-input/browser";
import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";

export function stickInputToString(input: StickInputControl): [string, string][] {
    const keys: [string, string][] = [];
    input.children.forEach((child, key) => {
        if (key === "x" || key === "y") return;
        else keys.push([key, input.name]);
    });
    return keys;
}

export function dPadCompositeToString(input: DPadComposite, keyboardMap: Map<string, string> | null): [string, string][] {
    const keys: [string, string][] = [];
    input.children.forEach((child, key) => {
        if (key === "x" || key === "y") return;
        let name = child.name;
        // remove the "key:" prefix
        name = name.replace("key:", "");
        if (keyboardMap?.has(name)) {
            name = keyboardMap.get(name)?.toUpperCase() ?? name;
        }
        keys.push([key, name]);
    });
    return keys;
}

export function vector2ToString(input: Vector2InputControl): [string, string][] {
    return [
        ["x", "pointerX"],
        ["y", "pointerY"]
    ];
}

export function buttonInputToString(input: ButtonInputControl, keyboardMap: Map<string, string> | null): string {
    let name = input.name;
    // remove the "key:" prefix
    name = name.replace("key:", "");
    if (keyboardMap?.has(name)) {
        name = keyboardMap.get(name)?.toUpperCase() ?? name;
    }
    return name;
}

export function axisCompositeToString(input: AxisComposite, keyboardMap: Map<string, string> | null): [string, string][] {
    const keys: [string, string][] = [];
    input.children.forEach((child, key) => {
        let name = child.name;
        // remove the "key:" prefix
        name = name.replace("key:", "");
        if (keyboardMap?.has(name)) {
            name = keyboardMap.get(name)?.toUpperCase() ?? name;
        }
        keys.push([key, name]);
    });
    return keys;
}

export function pressInteractionToStrings(pressInteraction: PressInteraction, keyboardMap: Map<string, string> | null): string[] {
    const bindings = pressInteraction.action.bindings;
    return bindings.map((binding) => buttonInputToString(binding.control as ButtonInputControl, keyboardMap));
}
