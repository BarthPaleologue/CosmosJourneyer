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

import { Color3 } from "@babylonjs/core/Maths/math.color";

export class CloudsModel {
    layerRadius: number;
    smoothness: number;
    specularPower: number;
    frequency: number;
    detailFrequency: number;
    coverage: number;
    sharpness: number;
    color: Color3;
    worleySpeed: number;
    detailSpeed: number;

    constructor(planetRadius: number, cloudLayerHeight: number, waterAmount: number, pressure: number) {
        this.layerRadius = planetRadius + cloudLayerHeight;
        this.specularPower = 2;
        this.smoothness = 0.7;
        this.frequency = 4;
        this.detailFrequency = 12;
        this.coverage = 0.75 * Math.exp(-waterAmount * pressure);
        this.sharpness = 2.5;
        this.color = new Color3(0.8, 0.8, 0.8);
        this.worleySpeed = 0.0005;
        this.detailSpeed = 0.003;
    }
}
