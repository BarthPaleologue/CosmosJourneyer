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

import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { Direction } from "@/utils/direction";

import { SphericalHeightFieldSide } from "./sphericalHeightFieldSide";

export class SphericalHeightFieldTerrain implements Transformable {
    private readonly transform: TransformNode;

    private readonly sides: [
        SphericalHeightFieldSide,
        SphericalHeightFieldSide,
        SphericalHeightFieldSide,
        SphericalHeightFieldSide,
        SphericalHeightFieldSide,
        SphericalHeightFieldSide,
    ];

    constructor(scene: Scene) {
        this.transform = new TransformNode("SphericalHeightFieldTerrain", scene);
        this.transform.rotationQuaternion = Quaternion.Identity();

        this.sides = [
            new SphericalHeightFieldSide(Direction.UP, this.transform, scene),
            new SphericalHeightFieldSide(Direction.DOWN, this.transform, scene),
            new SphericalHeightFieldSide(Direction.FORWARD, this.transform, scene),
            new SphericalHeightFieldSide(Direction.BACKWARD, this.transform, scene),
            new SphericalHeightFieldSide(Direction.LEFT, this.transform, scene),
            new SphericalHeightFieldSide(Direction.RIGHT, this.transform, scene),
        ];
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    dispose(): void {
        for (const side of this.sides) {
            side.dispose();
        }

        this.transform.dispose();
    }
}
