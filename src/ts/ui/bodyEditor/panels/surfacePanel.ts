//  This file is part of CosmosJourneyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { EditorPanel } from "../editorPanel";
import { TelluricPlanet } from "../../../planets/telluricPlanet/telluricPlanet";
import { clearAllEventListenersById } from "../../../utils/html";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Slider } from "handle-sliderjs";

export class SurfacePanel extends EditorPanel {
    constructor() {
        super("surface");
    }
    init(planet: TelluricPlanet) {
        for (const slider of this.sliders) slider.remove();

        const material = planet.material;
        const colorSettings = material.colorSettings;

        const snowColorPicker = clearAllEventListenersById("snowColor") as HTMLInputElement;
        snowColorPicker.value = colorSettings.snowColor.toHexString();
        snowColorPicker.addEventListener("input", () => {
            colorSettings.snowColor.copyFrom(Color3.FromHexString(snowColorPicker.value));
        });

        const plainColorPicker = clearAllEventListenersById("plainColor") as HTMLInputElement;
        plainColorPicker.value = colorSettings.plainColor.toHexString();
        plainColorPicker.addEventListener("input", () => {
            colorSettings.plainColor.copyFrom(Color3.FromHexString(plainColorPicker.value));
        });

        const steepColorPicker = clearAllEventListenersById("steepColor") as HTMLInputElement;
        steepColorPicker.value = colorSettings.steepColor.toHexString();
        steepColorPicker.addEventListener("input", () => {
            colorSettings.steepColor.copyFrom(Color3.FromHexString(steepColorPicker.value));
        });

        const sandColorPicker = clearAllEventListenersById("sandColor") as HTMLInputElement;
        sandColorPicker.value = colorSettings.beachColor.toHexString();
        sandColorPicker.addEventListener("input", () => {
            colorSettings.beachColor.copyFrom(Color3.FromHexString(sandColorPicker.value));
        });

        const desertColorPicker = clearAllEventListenersById("desertColor") as HTMLInputElement;
        desertColorPicker.value = colorSettings.desertColor.toHexString();
        desertColorPicker.addEventListener("input", () => {
            colorSettings.desertColor.copyFrom(Color3.FromHexString(desertColorPicker.value));
        });

        const bottomColorPicker = clearAllEventListenersById("bottomColor") as HTMLInputElement;
        bottomColorPicker.value = colorSettings.bottomColor.toHexString();
        bottomColorPicker.addEventListener("input", () => {
            colorSettings.bottomColor.copyFrom(Color3.FromHexString(bottomColorPicker.value));
        });

        this.sliders = [
            new Slider("sandSize", document.getElementById("sandSize") as HTMLElement, 0, 300, planet.material.colorSettings.beachSize / 10, (val: number) => {
                colorSettings.beachSize = val * 10;
                material.updateConstants();
            }),
            new Slider("steepSharpness", document.getElementById("steepSharpness") as HTMLElement, 0, 100, planet.material.colorSettings.steepSharpness * 10, (val: number) => {
                colorSettings.steepSharpness = val / 10;
                material.updateConstants();
            }),
            new Slider("normalSharpness", document.getElementById("normalSharpness") as HTMLElement, 0, 100, planet.material.colorSettings.normalSharpness * 100, (val: number) => {
                colorSettings.normalSharpness = val / 100;
                material.updateConstants();
            })
        ];
    }
}
