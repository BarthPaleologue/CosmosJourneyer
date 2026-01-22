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

import { CreateCapsule } from "@babylonjs/core/Meshes/Builders/capsuleBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import type { Scene } from "@babylonjs/core/scene";

import type { CharacterAvatar, CharacterAvatarState } from "./characterAvatar";

export class CapsuleAvatar implements CharacterAvatar {
    private readonly capsule: Mesh;
    readonly headTransform: TransformNode;
    readonly aggregate: PhysicsAggregate;
    private readonly mass = 80;

    readonly swimVerticalSpeed = 1.0;
    readonly walkSpeed = 1.8;

    constructor(scene: Scene) {
        this.capsule = CreateCapsule("capsuleAvatar", { height: 1.8, radius: 0.4 }, scene);
        this.aggregate = new PhysicsAggregate(this.capsule, PhysicsShapeType.CAPSULE, { mass: this.mass }, scene);

        this.headTransform = new TransformNode("capsuleAvatarHeadTransform", scene);
        this.headTransform.parent = this.capsule;
        this.headTransform.position.y = 0.9;
    }

    dance(): void {
        return;
    }

    jump(): void {
        this.aggregate.body.applyImpulse(
            this.getTransform().up.scale(this.mass * 50),
            this.getTransform().getAbsolutePosition(),
        );
    }

    sitOnGround(): void {
        return;
    }

    update(deltaSeconds: number): void {
        return;
    }

    getState(): CharacterAvatarState {
        throw new Error("Method not implemented.");
    }

    dispose(): void {
        this.getTransform().dispose();
    }

    move(x: number, z: number, running: number): void {
        throw new Error("Method not implemented.");
    }

    getTransform(): TransformNode {
        return this.capsule;
    }
}
