//  This file is part of Cosmos Journeyer
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
import { clearAllEventListenersById } from "../../../utils/html";
import { Settings } from "../../../settings";
import { Slider } from "handle-sliderjs";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CloudsPostProcess } from "../../../clouds/volumetricCloudsPostProcess";
import { CelestialBody } from "../../../architecture/celestialBody";

export class CloudsPanel extends EditorPanel {
    constructor() {
        super("clouds");
    }
    init(planet: CelestialBody, flatClouds: CloudsPostProcess) {
        for (const slider of this.sliders) slider.remove();

        const cloudsToggler = clearAllEventListenersById("cloudsToggler");
        cloudsToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[1] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            flatClouds.cloudUniforms.model.layerRadius = checkbox.checked ? planet.getBoundingRadius() + Settings.CLOUD_LAYER_HEIGHT : 0;
        });
        const cloudColorPicker = clearAllEventListenersById("cloudColor") as HTMLInputElement;
        cloudColorPicker.value = flatClouds.cloudUniforms.model.color.toHexString();
        cloudColorPicker.addEventListener("input", () => {
            flatClouds.cloudUniforms.model.color = Color3.FromHexString(cloudColorPicker.value);
        });
        this.sliders = [
            new Slider("cloudFrequency", document.getElementById("cloudFrequency") as HTMLElement, 0, 20, flatClouds.cloudUniforms.model.frequency, (val: number) => {
                flatClouds.cloudUniforms.model.frequency = val;
            }),
            new Slider(
                "cloudDetailFrequency",
                document.getElementById("cloudDetailFrequency") as HTMLElement,
                0,
                50,
                flatClouds.cloudUniforms.model.detailFrequency,
                (val: number) => {
                    flatClouds.cloudUniforms.model.detailFrequency = val;
                }
            ),
            new Slider("cloudCoverage", document.getElementById("cloudCoverage") as HTMLElement, 0, 200, 100 + flatClouds.cloudUniforms.model.coverage * 100, (val: number) => {
                flatClouds.cloudUniforms.model.coverage = (val - 100) / 100;
            }),
            new Slider("cloudSharpness", document.getElementById("cloudSharpness") as HTMLElement, 1, 100, flatClouds.cloudUniforms.model.sharpness * 10, (val: number) => {
                flatClouds.cloudUniforms.model.sharpness = val / 10;
            }),
            new Slider("worleySpeed", document.getElementById("worleySpeed") as HTMLElement, 0.0, 200.0, flatClouds.cloudUniforms.model.worleySpeed * 10000, (val: number) => {
                flatClouds.cloudUniforms.model.worleySpeed = val / 10000;
            }),
            new Slider("detailSpeed", document.getElementById("detailSpeed") as HTMLElement, 0, 200, flatClouds.cloudUniforms.model.detailSpeed * 10000, (val: number) => {
                flatClouds.cloudUniforms.model.detailSpeed = val / 10000;
            })
        ];
    }
}
