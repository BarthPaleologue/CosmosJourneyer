//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import Action from "@brianchirls/game-input/Action";
import {
    AxisComposite,
    ButtonInputControl,
    StickInputControl,
    Vector2InputControl,
} from "@brianchirls/game-input/browser";
import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import type Interaction from "@brianchirls/game-input/interactions/Interaction";

import {
    axisCompositeToString,
    buttonInputToString,
    dPadCompositeToString,
    stickInputToString,
    vector2ToString,
} from "@/frontend/helpers/inputControlsString";
import { InputMaps } from "@/frontend/inputs/inputMaps";

import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";

import i18n from "@/i18n";

import { type MusicConductor } from "../../audio/musicConductor";

export class SettingsPanel {
    readonly htmlRoot: HTMLElement;

    constructor(musicConductor: MusicConductor) {
        this.htmlRoot = this.createPanelHTML(musicConductor);
    }

    private createPanelHTML(musicConductor: MusicConductor): HTMLElement {
        const panel = document.createElement("div");
        panel.className = "sidePanel";

        // Create title
        const title = document.createElement("h2");
        title.textContent = i18n.t("sidePanel:settings");
        panel.appendChild(title);

        // Audio settings section
        const audioSection = document.createElement("div");
        audioSection.classList.add("settings-section");

        const volumeTitle = document.createElement("h3");
        volumeTitle.textContent = i18n.t("sidePanel:audioSettings");
        volumeTitle.style.fontFamily = "Nasalization, sans-serif";
        audioSection.appendChild(volumeTitle);

        const sliderContainer = document.createElement("div");
        sliderContainer.style.display = "flex";
        sliderContainer.style.alignItems = "center";
        sliderContainer.style.gap = "10px";
        sliderContainer.style.fontFamily = "Nasalization, sans-serif";

        const sliderLabel = document.createElement("label");
        sliderLabel.textContent = i18n.t("sidePanel:musicVolume");
        sliderLabel.style.fontFamily = "Nasalization, sans-serif";
        sliderLabel.style.minWidth = "80px";
        sliderLabel.style.flexGrow = "1";
        sliderLabel.style.color = "#fff";
        sliderLabel.style.fontWeight = "bold";
        sliderLabel.style.letterSpacing = "1px";
        sliderLabel.style.fontSize = "1.1em";
        sliderContainer.appendChild(sliderLabel);

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = "0";
        slider.max = "1";
        slider.step = "0.05";
        slider.value = musicConductor.getVolume().toString();
        slider.style.margin = "0 10px";
        slider.style.accentColor = "#ffffff";

        const percentage = document.createElement("span");
        percentage.textContent = (parseFloat(slider.value) * 100).toFixed(0) + "%";
        percentage.style.fontFamily = "Nasalization, sans-serif";
        percentage.style.color = "#fff";
        percentage.style.backgroundColor = "#1a1a1a";
        percentage.style.padding = "2px 8px";
        percentage.style.borderRadius = "4px";
        percentage.style.fontWeight = "bold";
        percentage.style.fontSize = "1em";
        percentage.style.marginLeft = "4px";
        percentage.style.minWidth = "50px";
        percentage.style.textAlign = "center";

        slider.addEventListener("input", () => {
            const volume = parseFloat(slider.value);
            percentage.textContent = (volume * 100).toFixed(0) + "%";
            musicConductor.setSoundtrackVolume(volume);
        });

        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(percentage);

        audioSection.appendChild(sliderContainer);
        panel.appendChild(audioSection);

        // Initialize input controls asynchronously
        void this.initializeInputControls(panel);

        return panel;
    }

    private async initializeInputControls(panel: HTMLElement): Promise<void> {
        const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();

        InputMaps.forEach((inputMap) => {
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

            panel.appendChild(mapDiv);
        });
    }
}
