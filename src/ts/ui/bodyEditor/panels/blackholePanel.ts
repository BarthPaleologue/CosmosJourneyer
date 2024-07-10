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
import { BlackHolePostProcess } from "../../../stellarObjects/blackHole/blackHolePostProcess";
import { BlackHole } from "../../../stellarObjects/blackHole/blackHole";

export class BlackholePanel extends EditorPanel {
    constructor() {
        super("blackHolePhysic");
    }
    init(blackhole: BlackHole, blackHole: BlackHolePostProcess) {
        for (const slider of this.sliders) slider.remove();

        this.sliders = [
            new Slider("diskRadius", document.getElementById("diskRadius") as HTMLElement, 0, 1000, blackHole.blackHoleUniforms.accretionDiskRadius / 1e5, (val: number) => {
                blackHole.blackHoleUniforms.accretionDiskRadius = val * 1e5;
            }),
            new Slider(
                "minkowskiWarpingFactor",
                document.getElementById("minkowskiWarpingFactor") as HTMLElement,
                0,
                5 * 10,
                blackHole.blackHoleUniforms.warpingMinkowskiFactor * 10,
                (val: number) => {
                    blackHole.blackHoleUniforms.warpingMinkowskiFactor = val / 10;
                }
            )
        ];
    }
}
