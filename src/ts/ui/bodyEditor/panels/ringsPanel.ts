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

import { EditorPanel } from "../editorPanel";
import { clearAllEventListenersById } from "../../../utils/html";
import { Slider } from "handle-sliderjs";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { RingsUniforms } from "../../../rings/ringsUniform";

export class RingsPanel extends EditorPanel {
    constructor() {
        super("rings");
    }
    init(ringsUniforms: RingsUniforms) {
        for (const slider of this.sliders) slider.remove();

        const ringsToggler = clearAllEventListenersById("ringsToggler");
        ringsToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[3] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            ringsUniforms.model.ringFrequency = checkbox.checked ? 30 : 0;
        });

        const snowColorPicker = clearAllEventListenersById("ringColor") as HTMLInputElement;
        snowColorPicker.value = ringsUniforms.model.ringColor.toHexString();
        snowColorPicker.addEventListener("input", () => {
            ringsUniforms.model.ringColor.copyFrom(Color3.FromHexString(snowColorPicker.value));
        });

        this.sliders = [
            new Slider(
                "ringsMinRadius",
                document.getElementById("ringsMinRadius") as HTMLElement,
                100,
                200,
                ringsUniforms.model.ringStart * 100,
                (val: number) => {
                    ringsUniforms.model.ringStart = val / 100;
                }
            ),
            new Slider(
                "ringsMaxRadius",
                document.getElementById("ringsMaxRadius") as HTMLElement,
                150,
                400,
                ringsUniforms.model.ringEnd * 100,
                (val: number) => {
                    ringsUniforms.model.ringEnd = val / 100;
                }
            ),
            new Slider(
                "ringsFrequency",
                document.getElementById("ringsFrequency") as HTMLElement,
                10,
                100,
                ringsUniforms.model.ringFrequency,
                (val: number) => {
                    ringsUniforms.model.ringFrequency = val;
                }
            ),
            new Slider(
                "ringsOpacity",
                document.getElementById("ringsOpacity") as HTMLElement,
                0,
                100,
                ringsUniforms.model.ringOpacity * 100,
                (val: number) => {
                    ringsUniforms.model.ringOpacity = val / 100;
                }
            )
        ];
    }
}
