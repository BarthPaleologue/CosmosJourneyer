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
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsMotionType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import type { Scene } from "@babylonjs/core/scene";

type CelestialBody = {
    name: string;
    position: Vector3;
    radius: number;
    mass: number;
};

export class GravitySystem {
    private readonly scene: Scene;
    constructor(scene: Scene) {
        this.scene = scene;
    }

    private filterPhysicsBodies(nodes: ReadonlyArray<TransformNode>): Array<PhysicsBody> {
        const physicsBodies: Array<PhysicsBody> = [];
        for (const node of nodes) {
            const physicsBody = node.physicsBody;
            if (
                physicsBody === null ||
                physicsBody === undefined ||
                physicsBody.getMotionType() !== PhysicsMotionType.DYNAMIC
            ) {
                continue;
            }

            physicsBodies.push(physicsBody);
        }

        return physicsBodies;
    }

    private getPhysicsBodies(): Array<PhysicsBody> {
        return this.filterPhysicsBodies(this.scene.meshes).concat(this.filterPhysicsBodies(this.scene.transformNodes));
    }

    public applyGravity(celestialBodies: ReadonlyArray<CelestialBody>) {
        for (const physicsBody of this.getPhysicsBodies()) {
            const objectMass = physicsBody.getMassProperties().mass;
            if (objectMass === undefined || objectMass === 0) {
                continue;
            }

            const totalForce = Vector3.Zero();
            for (const celestialBody of celestialBodies) {
                const scaledDirection = celestialBody.position.subtract(
                    physicsBody.transformNode.getAbsolutePosition(),
                );
                const distance = scaledDirection.length();
                //TODO: when 2.0 comes along, use the correct formula
                //const forceMagnitude = (G * body.mass * objectMass) / (distance * distance);
                const forceMagnitude = distance < celestialBody.radius + 200e3 ? 9.81 * objectMass : 0;
                if (forceMagnitude <= 1e-6) {
                    continue;
                }

                const force = scaledDirection.scale(forceMagnitude / distance);
                totalForce.addInPlace(force);
            }

            physicsBody.applyForce(totalForce, physicsBody.getObjectCenterWorld());
        }
    }
}
