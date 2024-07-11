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
import { Slider } from "handle-sliderjs";
import { VolumetricLight } from "../../../postProcesses/volumetricLight";
import { Star } from "../../../stellarObjects/star/star";

export class StarPanel extends EditorPanel {
    constructor() {
        super("starPhysic");
    }
    init(star: Star, volumetricLight: VolumetricLight) {
        for (const slider of this.sliders) slider.remove();

        this.sliders = [
            new Slider("temperature", document.getElementById("temperature") as HTMLElement, 3000, 15000, star.model.physicalProperties.temperature, (val: number) => {
                star.model.setSurfaceTemperature(val);
            }),
            new Slider("starExposure", document.getElementById("starExposure") as HTMLElement, 0, 200, volumetricLight.exposure * 100, (val: number) => {
                volumetricLight.exposure = val / 100;
            }),
            new Slider("decay", document.getElementById("decay") as HTMLElement, 0, 200, volumetricLight.decay * 100, (val: number) => {
                volumetricLight.decay = val / 100;
            })
        ];
    }
}
