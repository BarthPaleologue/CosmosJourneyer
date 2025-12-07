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

import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { BoneLookController } from "@babylonjs/core/Bones/boneLookController";
import { Space } from "@babylonjs/core/Maths/math.axis";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { PhysicsAggregate, PhysicsShapeCapsule, type PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import type { Scene } from "@babylonjs/core/scene";

import type { HumanoidInstance } from "@/frontend/assets/objects/humanoids";
import type { Transformable } from "@/frontend/universe/architecture/transformable";

import { CollisionMask } from "@/settings";

class AnimationGroupWrapper {
    name: string;
    group: AnimationGroup;
    weight: number;

    constructor(name: string, group: AnimationGroup, startingWeight: number, loop: boolean) {
        this.name = name;
        this.weight = startingWeight;

        this.group = group;
        this.group.play(loop);
        this.group.setWeightForAllAnimatables(startingWeight);
    }

    moveTowardsWeight(targetWeight: number, deltaTime: number) {
        this.weight = Math.min(Math.max(this.weight + deltaTime * Math.sign(targetWeight - this.weight), 0), 1);
        this.group.setWeightForAllAnimatables(this.weight);
    }
}

class AnimationState {
    readonly idleAnimation: AnimationGroupWrapper;
    readonly nonIdleAnimations: AnimationGroupWrapper[];
    currentAnimation: AnimationGroupWrapper;

    constructor(idleAnimation: AnimationGroupWrapper, nonIdleAnimations: AnimationGroupWrapper[]) {
        this.idleAnimation = idleAnimation;
        this.nonIdleAnimations = nonIdleAnimations;
        this.currentAnimation = idleAnimation;
    }
}

export class HumanoidAvatar implements Transformable {
    readonly instance: HumanoidInstance;

    readonly headLookController: BoneLookController;

    readonly walkSpeed = 1.8;
    readonly walkSpeedBackwards = 1.2;
    readonly runSpeed = 3.6;
    readonly swimSpeed = 1.5;

    private readonly idleAnim: AnimationGroupWrapper;
    private readonly walkAnim: AnimationGroupWrapper;
    private readonly walkBackAnim: AnimationGroupWrapper;
    private readonly danceAnim: AnimationGroupWrapper;
    private readonly runningAnim: AnimationGroupWrapper;

    private readonly swimmingIdleAnim: AnimationGroupWrapper;
    private readonly swimmingForwardAnim: AnimationGroupWrapper;

    private readonly jumpingAnim: AnimationGroupWrapper;

    private readonly fallingIdleAnim: AnimationGroupWrapper;
    private readonly skyDivingAnim: AnimationGroupWrapper;

    private readonly nonIdleAnimations: AnimationGroupWrapper[];

    private targetAnim: AnimationGroupWrapper | null = null;

    private readonly groundedState: AnimationState;
    private readonly fallingState: AnimationState;
    private readonly swimmingState: AnimationState;
    private currentAnimationState: AnimationState;

    private distanceToGround = 0;

    private readonly raycastResult = new PhysicsRaycastResult();

    private readonly root: AbstractMesh;

    private readonly physicsEngine: PhysicsEngineV2;

    private readonly mass = 80;
    readonly aggregate: PhysicsAggregate;

    constructor(instance: HumanoidInstance, scene: Scene) {
        this.instance = instance;
        this.root = instance.root as AbstractMesh;
        this.getTransform().rotationQuaternion = Quaternion.Identity();

        const capsuleRadius = 0.4;
        const shape = new PhysicsShapeCapsule(
            new Vector3(0, capsuleRadius, 0),
            new Vector3(0, 1.8 - capsuleRadius, 0),
            capsuleRadius,
            scene,
        );
        shape.material.restitution = 0.0;
        shape.material.friction = 0.0;
        shape.filterMembershipMask = CollisionMask.AVATARS;
        shape.filterCollideMask = CollisionMask.EVERYTHING;

        this.aggregate = new PhysicsAggregate(this.root, shape, { mass: this.mass });
        this.aggregate.body.setMassProperties({ inertia: Vector3.Zero() });
        this.aggregate.body.disablePreStep = false;

        this.physicsEngine = scene.getPhysicsEngine() as PhysicsEngineV2;
        this.idleAnim = new AnimationGroupWrapper("idle", instance.animations.idle, 1, true);
        this.walkAnim = new AnimationGroupWrapper("walk", instance.animations.walk, 0, true);
        this.walkBackAnim = new AnimationGroupWrapper("walkBack", instance.animations.walkBackward, 0, true);
        this.danceAnim = new AnimationGroupWrapper("dance", instance.animations.dance, 0, true);
        this.runningAnim = new AnimationGroupWrapper("running", instance.animations.run, 0, true);
        this.fallingIdleAnim = new AnimationGroupWrapper("fallingIdle", instance.animations.fall, 0, true);
        this.skyDivingAnim = new AnimationGroupWrapper("skydiving", instance.animations.skyDive, 0, true);
        this.swimmingIdleAnim = new AnimationGroupWrapper("swimming", instance.animations.swim.idle, 0, true);
        this.swimmingForwardAnim = new AnimationGroupWrapper(
            "swimmingForward",
            instance.animations.swim.forward,
            0,
            true,
        );
        this.jumpingAnim = new AnimationGroupWrapper("jumping", instance.animations.jump, 0, false);
        this.nonIdleAnimations = [
            this.walkAnim,
            this.walkBackAnim,
            this.danceAnim,
            this.runningAnim,
            this.fallingIdleAnim,
            this.jumpingAnim,
            this.skyDivingAnim,
            this.swimmingIdleAnim,
            this.swimmingForwardAnim,
        ];

        this.groundedState = new AnimationState(this.idleAnim, [
            this.walkAnim,
            this.walkBackAnim,
            this.danceAnim,
            this.runningAnim,
        ]);
        this.fallingState = new AnimationState(this.fallingIdleAnim, [this.skyDivingAnim]);
        this.swimmingState = new AnimationState(this.swimmingIdleAnim, [this.swimmingForwardAnim]);
        this.currentAnimationState = this.groundedState;

        this.targetAnim = this.idleAnim;

        this.headLookController = new BoneLookController(
            this.instance.head.attachmentMesh,
            this.instance.head.bone,
            Vector3.Zero(),
            {
                upAxis: Vector3.UpReadOnly,
                upAxisSpace: Space.BONE,
                slerpAmount: 0.2,
            },
        );
        this.resetLookAt();
    }

    public getTransform(): TransformNode {
        return this.root;
    }

    public update(deltaSeconds: number): void {
        const transform = this.getTransform();

        const linearVelocity = this.aggregate.body.getLinearVelocity();

        const verticalVelocityBackup = linearVelocity.dot(transform.up);

        const start = transform.getAbsolutePosition().add(transform.up.scale(50e3));
        const end = transform.position.add(transform.up.scale(-50e3));
        this.physicsEngine.raycastToRef(start, end, this.raycastResult, {
            collideWith: CollisionMask.ENVIRONMENT,
        });

        const horizontalVelocity = new Vector3();

        if (this.walkAnim.weight > 0.0) {
            horizontalVelocity.addInPlace(transform.forward.scaleInPlace(-this.walkSpeed * this.walkAnim.weight));
        }

        if (this.walkBackAnim.weight > 0.0) {
            horizontalVelocity.addInPlace(
                transform.forward.scaleInPlace(this.walkSpeedBackwards * this.walkBackAnim.weight),
            );
        }

        if (this.runningAnim.weight > 0.0) {
            horizontalVelocity.addInPlace(transform.forward.scaleInPlace(-this.runSpeed * this.runningAnim.weight));
        }

        if (this.runningAnim.weight > 0.0) {
            horizontalVelocity.addInPlace(transform.forward.scaleInPlace(-this.runSpeed * this.runningAnim.weight));
        }

        this.targetAnim = this.currentAnimationState.currentAnimation;

        let weightSum = 0;
        for (const animation of this.nonIdleAnimations) {
            if (animation === this.targetAnim) {
                animation.moveTowardsWeight(1, deltaSeconds);
            } else {
                animation.moveTowardsWeight(0, deltaSeconds);
            }
            weightSum += animation.weight;
        }

        this.idleAnim.moveTowardsWeight(Math.min(Math.max(1 - weightSum, 0.0), 1.0), deltaSeconds);

        this.headLookController.update();

        this.aggregate.body.setLinearVelocity(
            horizontalVelocity.addInPlace(transform.up.scaleInPlace(verticalVelocityBackup)),
        );
    }

    public move(xMove: number, yMove: number, running: number): void {
        // Translation
        if (this.currentAnimationState === this.swimmingState) {
            this.swimmingState.currentAnimation = this.swimmingIdleAnim;
            if (yMove > 0) {
                this.swimmingState.currentAnimation = this.swimmingForwardAnim;
                this.aggregate.body.setLinearVelocity(this.root.forward.scale(-this.swimSpeed));
            }
        } else if (this.currentAnimationState === this.groundedState) {
            if (this.groundedState.currentAnimation !== this.danceAnim) {
                this.groundedState.currentAnimation = this.idleAnim;
            }
            if (yMove > 0) {
                this.groundedState.currentAnimation = running > 0 ? this.runningAnim : this.walkAnim;
            } else if (yMove < 0) {
                this.groundedState.currentAnimation = this.walkBackAnim;
            } else if (running > 0) {
                this.groundedState.currentAnimation = this.runningAnim;
            }
        } else if (this.currentAnimationState === this.fallingState) {
            if (this.distanceToGround < 30) {
                this.fallingState.currentAnimation = this.fallingIdleAnim;
            } else {
                this.fallingState.currentAnimation = this.skyDivingAnim;
            }
        }

        this.root.computeWorldMatrix(true);
    }

    public dance() {
        this.groundedState.currentAnimation = this.danceAnim;
    }

    public jump() {
        this.targetAnim = this.jumpingAnim;
        this.jumpingAnim.weight = 1;
        this.jumpingAnim.group.stop();
        this.jumpingAnim.group.play();
        //this.currentAnimationState = this.fallingState;

        this.aggregate.body.applyImpulse(
            this.getTransform().up.scale(this.mass * 50),
            this.getTransform().getAbsolutePosition(),
        );
    }

    public lookAt(target: Vector3) {
        this.headLookController.target.copyFrom(target);
        this.headLookController.minYaw = -Math.PI / 4;
        this.headLookController.maxYaw = Math.PI / 4;
        this.headLookController.minPitch = -Math.PI / 6;
        this.headLookController.maxPitch = Math.PI / 6;
    }

    public resetLookAt() {
        this.headLookController.target.copyFrom(Vector3.Zero());
        this.headLookController.minYaw = 0;
        this.headLookController.maxYaw = 0;
        this.headLookController.minPitch = 0;
        this.headLookController.maxPitch = 0;
    }

    public dispose() {
        const { animations } = this.instance;
        for (const group of [
            animations.idle,
            animations.walk,
            animations.walkBackward,
            animations.dance,
            animations.run,
            animations.jump,
            animations.fall,
            animations.skyDive,
            animations.swim.idle,
            animations.swim.forward,
        ]) {
            group.dispose();
        }

        this.root.dispose();
    }
}
