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

import type { Material } from "@babylonjs/core/Materials/material";
import { Mesh } from "@babylonjs/core/Meshes";
import { PhysicsShapeConvexHull, type PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
import type { Scene } from "@babylonjs/core/scene";

import { CollisionMask } from "@/settings";

import type { ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { AvailableRockSizes } from "./rockSizes";
import { loadAssetInContainerAsync } from "./utils";

import rockPath from "@assets/rock.glb";

export async function loadRock(
    material: Material,
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor,
): Promise<{
    mesh: Mesh;
    sizeToShape: Map<number, PhysicsShape>;
}> {
    const rockContainer = await loadAssetInContainerAsync("Rock", rockPath, scene, progressMonitor);
    const mesh = rockContainer.meshes[1];
    if (!(mesh instanceof Mesh)) {
        throw new Error("Rock root node is not a Mesh");
    }

    mesh.setParent(null);
    mesh.position.y = 0.1;
    mesh.scaling.scaleInPlace(0.2);
    mesh.bakeCurrentTransformIntoVertices();
    mesh.isVisible = false;
    mesh.receiveShadows = true;
    mesh.material = material;

    rockContainer.addAllToScene();

    const sizeToShape = new Map<number, PhysicsShape>();
    for (const size of AvailableRockSizes) {
        const clone = mesh.clone(`${mesh.name}_clone_${size}`);
        clone.makeGeometryUnique();
        clone.scaling.scaleInPlace(size);
        clone.bakeCurrentTransformIntoVertices();

        const shape = new PhysicsShapeConvexHull(clone, scene);
        shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
        shape.filterCollideMask = CollisionMask.EVERYTHING & ~CollisionMask.ENVIRONMENT;
        sizeToShape.set(size, shape);

        clone.dispose();
    }

    return { mesh, sizeToShape };
}
