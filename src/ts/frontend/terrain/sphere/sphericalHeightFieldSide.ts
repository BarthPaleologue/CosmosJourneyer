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

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { type Direction } from "@/utils/direction";

export class SphericalHeightFieldSide {
    readonly mesh: Mesh;

    private readonly direction: Direction;

    constructor(direction: Direction, parent: TransformNode, scene: Scene) {
        this.mesh = new Mesh("SphericalHeightFieldSide", scene);
        this.mesh.isPickable = false;
        this.mesh.parent = parent;

        this.direction = direction;
    }

    dispose(): void {
        this.mesh.dispose();
    }
}
