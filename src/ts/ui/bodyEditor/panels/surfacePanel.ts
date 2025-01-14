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
import { TelluricPlanetMaterial } from "../../../planets/telluricPlanet/telluricPlanetMaterial";

export class SurfacePanel extends EditorPanel {
    constructor() {
        super("surface");
    }
    init(planetMaterial: TelluricPlanetMaterial) {
        for (const slider of this.sliders) slider.remove();

        this.sliders = [
            new Slider("sandSize", document.getElementById("sandSize") as HTMLElement, 0, 300, planetMaterial.getBeachSize() / 10, (val: number) => {
                planetMaterial.setBeachSize(val * 10);
            }),
            new Slider("steepSharpness", document.getElementById("steepSharpness") as HTMLElement, 0, 100, planetMaterial.getSteepSharpness() * 10, (val: number) => {
                planetMaterial.setSteepSharpness(val / 10);
            })
        ];
    }
}
