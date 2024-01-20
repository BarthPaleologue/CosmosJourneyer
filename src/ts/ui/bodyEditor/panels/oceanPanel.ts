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
import { clearAllEventListenersById } from "../../../utils/html";
import { Slider } from "handle-sliderjs";
import { OceanPostProcess } from "../../../postProcesses/oceanPostProcess";
import { CelestialBody } from "../../../architecture/celestialBody";

export class OceanPanel extends EditorPanel {
    constructor() {
        super("ocean");
    }
    init(planet: CelestialBody, ocean: OceanPostProcess) {
        for (const slider of this.sliders) slider.remove();

        const oceanToggler = clearAllEventListenersById("oceanToggler");
        oceanToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[0] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            ocean.oceanUniforms.oceanRadius = checkbox.checked ? planet.getBoundingRadius() : 0;
        });
        this.sliders = [
            new Slider("alphaModifier", document.getElementById("alphaModifier") as HTMLElement, 0, 200, ocean.oceanUniforms.alphaModifier * 10000, (val: number) => {
                ocean.oceanUniforms.alphaModifier = val / 10000;
            }),
            new Slider("depthModifier", document.getElementById("depthModifier") as HTMLElement, 0, 70, ocean.oceanUniforms.depthModifier * 10000, (val: number) => {
                ocean.oceanUniforms.depthModifier = val / 10000;
            }),
            new Slider("specularPower", document.getElementById("specularPower") as HTMLElement, 0, 100, ocean.oceanUniforms.specularPower * 10, (val: number) => {
                ocean.oceanUniforms.specularPower = val / 10;
            }),
            new Slider("smoothness", document.getElementById("smoothness") as HTMLElement, 0, 100, ocean.oceanUniforms.smoothness * 100, (val: number) => {
                ocean.oceanUniforms.smoothness = val / 100;
            }),
            new Slider(
                "waveBlendingSharpness",
                document.getElementById("waveBlendingSharpness") as HTMLElement,
                0,
                100,
                ocean.oceanUniforms.waveBlendingSharpness * 100,
                (val: number) => {
                    ocean.oceanUniforms.waveBlendingSharpness = val / 100;
                }
            )
        ];
    }
}
