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
import { TelluricPlanet } from "../../../planets/telluricPlanet/telluricPlanet";
import { Slider } from "handle-sliderjs";

export class SurfacePanel extends EditorPanel {
    constructor() {
        super("surface");
    }
    init(planet: TelluricPlanet) {
        for (const slider of this.sliders) slider.remove();

        const material = planet.material;
        const colorSettings = material.colorSettings;

        this.sliders = [
            new Slider("sandSize", document.getElementById("sandSize") as HTMLElement, 0, 300, planet.material.colorSettings.beachSize / 10, (val: number) => {
                colorSettings.beachSize = val * 10;
                material.updateConstants();
            }),
            new Slider("steepSharpness", document.getElementById("steepSharpness") as HTMLElement, 0, 100, planet.material.colorSettings.steepSharpness * 10, (val: number) => {
                colorSettings.steepSharpness = val / 10;
                material.updateConstants();
            }),
            new Slider("normalSharpness", document.getElementById("normalSharpness") as HTMLElement, 0, 100, planet.material.colorSettings.normalSharpness * 10, (val: number) => {
                colorSettings.normalSharpness = val / 10;
                material.updateConstants();
            })
        ];
    }
}
