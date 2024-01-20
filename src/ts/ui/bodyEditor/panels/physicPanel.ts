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
import { Slider } from "handle-sliderjs";
import { TelluricPlanet } from "../../../planets/telluricPlanet/telluricPlanet";

export class PhysicPanel extends EditorPanel {
    constructor() {
        super("physic");
    }
    init(planet: TelluricPlanet) {
        for (const slider of this.sliders) slider.remove();

        this.sliders = [
            new Slider("minTemperature", document.getElementById("minTemperature") as HTMLElement, -273, 300, planet.model.physicalProperties.minTemperature, (val: number) => {
                planet.model.physicalProperties.minTemperature = val;
                planet.material.updateConstants();
            }),
            new Slider("maxTemperature", document.getElementById("maxTemperature") as HTMLElement, -273, 300, planet.model.physicalProperties.maxTemperature, (val: number) => {
                planet.model.physicalProperties.maxTemperature = val;
                planet.material.updateConstants();
            })
        ];
    }
}
