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

import { OceanUniforms } from "../../../ocean/oceanUniforms";
import { EditorPanel } from "../editorPanel";
import { Slider } from "handle-sliderjs";

export class OceanPanel extends EditorPanel {
    constructor() {
        super("ocean");
    }
    init(oceanUniforms: OceanUniforms) {
        for (const slider of this.sliders) slider.remove();

        this.sliders = [
            new Slider(
                "alphaModifier",
                document.getElementById("alphaModifier") as HTMLElement,
                0,
                200,
                oceanUniforms.alphaModifier * 10000,
                (val: number) => {
                    oceanUniforms.alphaModifier = val / 10000;
                }
            ),
            new Slider(
                "depthModifier",
                document.getElementById("depthModifier") as HTMLElement,
                0,
                70,
                oceanUniforms.depthModifier * 10000,
                (val: number) => {
                    oceanUniforms.depthModifier = val / 10000;
                }
            ),
            new Slider(
                "specularPower",
                document.getElementById("specularPower") as HTMLElement,
                0,
                100,
                oceanUniforms.specularPower * 10,
                (val: number) => {
                    oceanUniforms.specularPower = val / 10;
                }
            ),
            new Slider(
                "smoothness",
                document.getElementById("smoothness") as HTMLElement,
                0,
                100,
                oceanUniforms.smoothness * 100,
                (val: number) => {
                    oceanUniforms.smoothness = val / 100;
                }
            ),
            new Slider(
                "waveBlendingSharpness",
                document.getElementById("waveBlendingSharpness") as HTMLElement,
                0,
                100,
                oceanUniforms.waveBlendingSharpness * 100,
                (val: number) => {
                    oceanUniforms.waveBlendingSharpness = val / 100;
                }
            )
        ];
    }
}
