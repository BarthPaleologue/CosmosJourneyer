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

import { GreasedLineMeshColorMode } from "@babylonjs/core/Materials/GreasedLine/greasedLineMaterialInterfaces";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateGreasedLine } from "@babylonjs/core/Meshes/Builders/greasedLineBuilder";
import { CreateLines } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { type Scene } from "@babylonjs/core/scene";

import { type RGBColor } from "@/utils/colors";

export type CreateLinesMeshFunction = (
    name: string,
    points: ReadonlyArray<Vector3>,
    color: RGBColor,
    scene: Scene,
) => Mesh;

export const CreateGreasedLineHelper: CreateLinesMeshFunction = (
    name: string,
    points: ReadonlyArray<Vector3>,
    color: RGBColor,
    scene: Scene,
) => {
    return CreateGreasedLine(
        name,
        {
            points: [...points],
            updatable: false,
        },
        {
            color: new Color3(color.r, color.g, color.b),
            width: 5,
            colorMode: GreasedLineMeshColorMode.COLOR_MODE_SET,
            sizeAttenuation: true,
        },
        scene,
    );
};

export const CreateLinesHelper: CreateLinesMeshFunction = (
    name: string,
    points: ReadonlyArray<Vector3>,
    color: RGBColor,
    scene: Scene,
) => {
    const color4 = new Color4(color.r, color.g, color.b, 1.0);
    const colors = points.map(() => color4);
    return CreateLines(name, { points: [...points], colors, updatable: false }, scene);
};
