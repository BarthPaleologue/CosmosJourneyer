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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import type { Scene } from "@babylonjs/core/scene";

export class FloatingOriginSystem {
    private readonly originOffset: Vector3 = Vector3.Zero();

    private readonly rebasingThreshold: number;

    private readonly scene: Scene;

    public constructor(scene: Scene, rebasingThreshold: number) {
        this.rebasingThreshold = rebasingThreshold;
        this.scene = scene;
    }

    public update(observerPosition: Vector3) {
        if (observerPosition.lengthSquared() < this.rebasingThreshold * this.rebasingThreshold) {
            return;
        }

        const offset = observerPosition.clone().negateInPlace();
        this.originOffset.addInPlace(offset);

        // find all physics bodies that have disablePreStep=true
        const physicsBodies: Array<PhysicsBody> = [];
        for (const mesh of [...this.scene.meshes, ...this.scene.transformNodes]) {
            const physicsBody = mesh.physicsBody;
            if (physicsBody !== null && physicsBody !== undefined && physicsBody.disablePreStep) {
                physicsBody.disablePreStep = false;
                physicsBodies.push(physicsBody);
            }
        }

        for (const rootNode of this.scene.rootNodes) {
            if (rootNode instanceof TransformNode && !rootNode.infiniteDistance && rootNode.isVisible) {
                rootNode.setAbsolutePosition(rootNode.getAbsolutePosition().add(offset));
                rootNode.computeWorldMatrix(true);
            }
        }

        for (const body of physicsBodies) {
            this.scene.onAfterPhysicsObservable.addOnce(() => {
                body.disablePreStep = true;
            });
        }
    }

    public getOffsetToRef(ref: Vector3): Vector3 {
        return ref.copyFrom(this.originOffset);
    }

    public reset() {
        this.originOffset.setAll(0);
    }
}
