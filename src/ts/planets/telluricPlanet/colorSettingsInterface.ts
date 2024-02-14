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

export enum ColorMode {
    DEFAULT,
    MOISTURE,
    TEMPERATURE,
    NORMAL,
    HEIGHT
}

export interface ColorSettings {
    mode: number;

    snowColor: Color3;
    steepColor: Color3;
    plainColor: Color3;
    beachColor: Color3;
    desertColor: Color3;
    bottomColor: Color3;

    beachSize: number;
    steepSharpness: number;
    normalSharpness: number;
}

export interface GazColorSettings {
    color1: Color3;
    color2: Color3;
    color3: Color3;
    colorSharpness: number;
}
