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
import { GasPlanet } from "../../../planets/gasPlanet/gasPlanet";
import { clearAllEventListenersById } from "../../../utils/html";
import { Slider } from "handle-sliderjs";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export class GasCloudsPanel extends EditorPanel {
    constructor() {
        super("gazClouds");
    }
    init(planet: GasPlanet) {
        for (const slider of this.sliders) slider.remove();

        const material = planet.material;
        const colorSettings = material.colorSettings;

        const gazColor1Picker = clearAllEventListenersById("gazColor1") as HTMLInputElement;
        gazColor1Picker.value = colorSettings.color1.toHexString();
        gazColor1Picker.addEventListener("input", () => {
            colorSettings.color1.copyFrom(Color3.FromHexString(gazColor1Picker.value));
        });

        const gazColor2Picker = clearAllEventListenersById("gazColor2") as HTMLInputElement;
        gazColor2Picker.value = colorSettings.color2.toHexString();
        gazColor2Picker.addEventListener("input", () => {
            colorSettings.color2.copyFrom(Color3.FromHexString(gazColor2Picker.value));
        });

        const gazColor3Picker = clearAllEventListenersById("gazColor3") as HTMLInputElement;
        gazColor3Picker.value = colorSettings.color3.toHexString();
        gazColor3Picker.addEventListener("input", () => {
            colorSettings.color3.copyFrom(Color3.FromHexString(gazColor3Picker.value));
        });

        this.sliders = [
            new Slider("colorSharpness", document.getElementById("colorSharpness") as HTMLElement, 0, 100, planet.material.colorSettings.colorSharpness * 10, (val: number) => {
                colorSettings.colorSharpness = val / 10;
                material.updateConstants();
            })
        ];
    }
}
