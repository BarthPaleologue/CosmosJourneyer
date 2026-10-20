import type { AxisComposite, ButtonInputControl, StickInputControl } from "@brianchirls/game-input/browser";
import type DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import type PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";

/**
 * @param input - Stick whose directional bindings are formatted.
 * @returns Directional key-label pairs, excluding raw `x` and `y` axes.
 */
export function stickInputToString(input: StickInputControl): [string, string][] {
    const keys: [string, string][] = [];
    input.children.forEach((child, key) => {
        if (key === "x" || key === "y") {
            return;
        } else {
            keys.push([key, input.name]);
        }
    });
    return keys;
}

/**
 * @param input - D-pad whose bindings are formatted.
 * @param keyboardMap - Keyboard labels, or null to use control names.
 * @returns Directional bindings in display order.
 */
export function dPadCompositeToString(
    input: DPadComposite,
    keyboardMap: Map<string, string> | null,
): [string, string][] {
    const keys: [string, string][] = [];
    input.children.forEach((child, key) => {
        if (key === "x" || key === "y") {
            return;
        }
        let name = child.name;
        // remove the "key:" prefix
        name = name.replace("key:", "");
        name = keyboardMap?.get(name)?.toUpperCase() ?? name;
        keys.push([key, name]);
    });

    if (keys[0] === undefined || keys[1] === undefined || keys[2] === undefined || keys[3] === undefined) {
        throw new Error("DPadComposite keys are undefined");
    }

    return [keys[2], keys[0], keys[3], keys[1]];
}

/**
 * @returns The pointer axis identifiers and labels.
 */
export function vector2ToString(): [string, string][] {
    return [
        ["x", "pointerX"],
        ["y", "pointerY"],
    ];
}

/**
 * @param input - Button binding to label.
 * @param keyboardMap - Keyboard labels, or null to use control names.
 * @returns The display label for the binding.
 */
export function buttonInputToString(input: ButtonInputControl, keyboardMap: Map<string, string> | null): string {
    let name = input.name;
    // remove the "key:" prefix
    name = name.replace("key:", "");
    name = keyboardMap?.get(name)?.toUpperCase() ?? name;
    return name;
}

/**
 * @param input - Axis whose component bindings are formatted.
 * @param keyboardMap - Keyboard labels, or null to use control names.
 * @returns Component binding identifiers and labels.
 */
export function axisCompositeToString(
    input: AxisComposite,
    keyboardMap: Map<string, string> | null,
): [string, string][] {
    const keys: [string, string][] = [];
    input.children.forEach((child, key) => {
        let name = child.name;
        // remove the "key:" prefix
        name = name.replace("key:", "");
        name = keyboardMap?.get(name)?.toUpperCase() ?? name;
        keys.push([key, name]);
    });
    return keys;
}

/**
 * @param pressInteraction - Interaction whose bound buttons are formatted.
 * @param keyboardMap - Keyboard labels, or null to use control names.
 * @returns Labels for each bound button.
 */
export function pressInteractionToStrings(
    pressInteraction: PressInteraction,
    keyboardMap: Map<string, string> | null,
): string[] {
    const bindings = pressInteraction.action.bindings;
    return bindings.map((binding) => buttonInputToString(binding.control as ButtonInputControl, keyboardMap));
}
