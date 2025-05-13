import Action from "@brianchirls/game-input/Action";
import {
    AxisComposite,
    ButtonInputControl,
    StickInputControl,
    Vector2InputControl
} from "@brianchirls/game-input/browser";
import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import Interaction from "@brianchirls/game-input/interactions/Interaction";

import { InputMaps } from "../inputs/inputMaps";
import { getGlobalKeyboardLayoutMap } from "../utils/keyboardAPI";
import {
    axisCompositeToString,
    buttonInputToString,
    dPadCompositeToString,
    stickInputToString,
    vector2ToString
} from "../utils/strings/inputControlsString";

export function initSettingsPanel(): HTMLElement {
    const settingsPanel = document.getElementById("settingsPanel");
    if (settingsPanel === null) throw new Error("#settings does not exist!");

    void getGlobalKeyboardLayoutMap().then((keyboardLayoutMap) => {
        InputMaps.forEach((inputMap) => {
            // create a div
            // the name of the map will be an h3
            // each action will be a div with the name of the action and the bindings
            const mapDiv = document.createElement("div");
            mapDiv.classList.add("map");
            const mapName = document.createElement("h3");
            // break camelCase with a space
            mapName.textContent = inputMap.name.replace(/([A-Z])/g, " $1").trim();

            mapDiv.appendChild(mapName);

            for (const [actionName, action] of Object.entries(inputMap.map)) {
                const subActionMap: Map<string, string[]> = new Map();

                const actionOrInteraction = action as Action | Interaction;
                const bindings =
                    actionOrInteraction instanceof Action
                        ? actionOrInteraction.bindings
                        : actionOrInteraction.action.bindings;
                bindings.forEach((binding) => {
                    if (binding.control instanceof DPadComposite) {
                        const strings = dPadCompositeToString(binding.control, keyboardLayoutMap);
                        strings.forEach((string) => {
                            const [key, name] = string;
                            if (!subActionMap.has(key)) {
                                subActionMap.set(key, []);
                            }
                            subActionMap.get(key)?.push(name);
                        });
                    } else if (binding.control instanceof ButtonInputControl) {
                        const text = buttonInputToString(binding.control as ButtonInputControl, keyboardLayoutMap);
                        if (!subActionMap.has("BUTTON")) {
                            subActionMap.set("BUTTON", []);
                        }
                        subActionMap.get("BUTTON")?.push(text);
                    } else if (binding.control instanceof AxisComposite) {
                        const strings = axisCompositeToString(binding.control, keyboardLayoutMap);
                        strings.forEach((string) => {
                            const [key, name] = string;
                            if (!subActionMap.has(key)) {
                                subActionMap.set(key, []);
                            }
                            subActionMap.get(key)?.push(name);
                        });
                    } else if (binding.control instanceof StickInputControl) {
                        const strings = stickInputToString(binding.control);
                        strings.forEach((string) => {
                            const [key, name] = string;
                            if (!subActionMap.has(key)) {
                                subActionMap.set(key, []);
                            }
                            subActionMap.get(key)?.push(name);
                        });
                    } else if (binding.control instanceof Vector2InputControl) {
                        const strings = vector2ToString();
                        strings.forEach((string) => {
                            const [key, name] = string;
                            if (!subActionMap.has(key)) {
                                subActionMap.set(key, []);
                            }
                            subActionMap.get(key)?.push(name);
                        });
                    } else {
                        throw new Error("Unknown control type");
                    }
                });

                const actionDiv = document.createElement("div");

                const label = document.createElement("p");
                // break camelCase with a space
                label.textContent = actionName.replace(/([A-Z])/g, " $1").trim();

                actionDiv.appendChild(label);

                if (subActionMap.size === 1) {
                    actionDiv.classList.add("actionSingle");

                    const valuesContainer = document.createElement("div");
                    valuesContainer.classList.add("valuesContainer");

                    for (const value of subActionMap.values()) {
                        value.forEach((v) => {
                            const valueContainer = document.createElement("p");
                            valueContainer.innerText = v;
                            valuesContainer.appendChild(valueContainer);
                        });
                    }

                    actionDiv.appendChild(valuesContainer);
                } else {
                    actionDiv.classList.add("actionMultiple");

                    subActionMap.forEach((value, key) => {
                        const subActionDiv = document.createElement("div");
                        subActionDiv.classList.add("subAction");

                        const subActionLabel = document.createElement("p");
                        subActionLabel.textContent = key;

                        const valuesContainer = document.createElement("div");
                        valuesContainer.classList.add("valuesContainer");

                        value.forEach((v) => {
                            const valueContainer = document.createElement("p");
                            valueContainer.innerText = v;
                            valuesContainer.appendChild(valueContainer);
                        });

                        subActionDiv.appendChild(subActionLabel);
                        subActionDiv.appendChild(valuesContainer);

                        actionDiv.appendChild(subActionDiv);
                    });
                }

                mapDiv.appendChild(actionDiv);
            }

            settingsPanel.appendChild(mapDiv);
        });
    });

    return settingsPanel;
}
