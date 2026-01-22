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
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { PhysicsAggregate, PhysicsShapeCapsule, type PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import type { Scene } from "@babylonjs/core/scene";

import type { HumanoidInstance } from "@/frontend/assets/objects/humanoids";

import { moveTowards } from "@/utils/math";

import { CollisionMask } from "@/settings";

import type { CharacterAvatar, CharacterAvatarState, SurfaceInfo } from "./characterAvatar";

class AnimationState {
    readonly idleAnimation: AnimationGroup;
    readonly nonIdleAnimations: Array<AnimationGroup>;
    currentAnimation: AnimationGroup;

    constructor(idleAnimation: AnimationGroup, nonIdleAnimations: ReadonlyArray<AnimationGroup>) {
        this.idleAnimation = idleAnimation;
        this.nonIdleAnimations = [...nonIdleAnimations];
        this.currentAnimation = idleAnimation;
    }
}

export class HumanoidAvatar implements CharacterAvatar {
    readonly instance: HumanoidInstance;

    private readonly headLookController: BoneLookController;
    private isLookingAtTarget = false;

    readonly walkSpeed = 1.8;
    readonly walkSpeedBackwards = 1.2;
    readonly runSpeed = 3.6;
    readonly swimSpeed = 1.5;
    readonly swimVerticalSpeed = 1.0;

    private readonly idleAnim: AnimationGroup;
    private readonly walkAnim: AnimationGroup;
    private readonly walkBackAnim: AnimationGroup;
    private readonly danceAnim: AnimationGroup;
    private readonly runningAnim: AnimationGroup;
    private readonly swimmingIdleAnim: AnimationGroup;
    private readonly swimmingForwardAnim: AnimationGroup;

    private readonly sittingOnGroundIdleAnim: AnimationGroup;
    private readonly sittingOnSeatIdleAnim: AnimationGroup;

    private readonly jumpingAnim: AnimationGroup;
    private readonly fallingIdleAnim: AnimationGroup;
    private readonly skyDivingAnim: AnimationGroup;

    private readonly nonIdleAnimations: Array<AnimationGroup>;
    private targetAnim: AnimationGroup | null = null;

    private readonly groundedState: AnimationState;
    private readonly seatedState: AnimationState;
    private readonly fallingState: AnimationState;
    private readonly swimmingState: AnimationState;
    private currentAnimationState: AnimationState;

    private lastSurfaceInfo: SurfaceInfo | null = null;

    private readonly raycastResult = new PhysicsRaycastResult();

    private readonly root: AbstractMesh;

    private readonly physicsEngine: PhysicsEngineV2;

    private readonly mass = 80;
    readonly aggregate: PhysicsAggregate;

    readonly headTransform: TransformNode;

    constructor(instance: HumanoidInstance, physicsEngine: PhysicsEngineV2, scene: Scene) {
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
        shape.filterCollideMask = CollisionMask.ENVIRONMENT | CollisionMask.DYNAMIC_OBJECTS | CollisionMask.AVATARS;

        this.aggregate = new PhysicsAggregate(this.root, shape, { mass: this.mass });
        this.aggregate.body.setMassProperties({ inertia: Vector3.Zero() });
        this.aggregate.body.disablePreStep = false;

        this.physicsEngine = physicsEngine;

        this.headTransform = new TransformNode("characterHeadTransform", scene);
        this.headTransform.attachToBone(this.instance.head.bone, this.instance.head.attachmentMesh);

        this.idleAnim = instance.animations.idle;
        this.idleAnim.play(true);
        this.idleAnim.weight = 1;

        this.walkAnim = instance.animations.walk;
        this.walkAnim.play(true);
        this.walkAnim.weight = 0;

        this.walkBackAnim = instance.animations.walkBackward;
        this.walkBackAnim.play(true);
        this.walkBackAnim.weight = 0;

        this.danceAnim = instance.animations.dance;
        this.danceAnim.play(true);
        this.danceAnim.weight = 0;

        this.runningAnim = instance.animations.run;
        this.runningAnim.play(true);
        this.runningAnim.weight = 0;

        this.fallingIdleAnim = instance.animations.fall;
        this.fallingIdleAnim.play(true);
        this.fallingIdleAnim.weight = 0;

        this.skyDivingAnim = instance.animations.skyDive;
        this.skyDivingAnim.play(true);
        this.skyDivingAnim.weight = 0;

        this.swimmingIdleAnim = instance.animations.swim.idle;
        this.swimmingIdleAnim.play(true);
        this.swimmingIdleAnim.weight = 0;

        this.swimmingForwardAnim = instance.animations.swim.forward;
        this.swimmingForwardAnim.play(true);
        this.swimmingForwardAnim.weight = 0;

        this.jumpingAnim = instance.animations.jump;
        this.jumpingAnim.play();
        this.jumpingAnim.weight = 0;

        this.sittingOnGroundIdleAnim = instance.animations.sittingOnGroundIdle;
        this.sittingOnGroundIdleAnim.play(true);
        this.sittingOnGroundIdleAnim.weight = 0;

        this.sittingOnSeatIdleAnim = instance.animations.sittingOnSeatIdle;
        this.sittingOnSeatIdleAnim.play(true);
        this.sittingOnSeatIdleAnim.weight = 0;

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
            this.sittingOnGroundIdleAnim,
            this.sittingOnSeatIdleAnim,
        ];

        this.groundedState = new AnimationState(this.idleAnim, [
            this.walkAnim,
            this.walkBackAnim,
            this.danceAnim,
            this.runningAnim,
            this.sittingOnGroundIdleAnim,
        ]);
        this.seatedState = new AnimationState(this.sittingOnSeatIdleAnim, []);
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
                minYaw: -Math.PI / 4,
                maxYaw: Math.PI / 4,
                minPitch: -Math.PI / 6,
                maxPitch: Math.PI / 6,
            },
        );
    }

    public getTransform(): TransformNode {
        return this.root;
    }

    public getState(): CharacterAvatarState {
        if (this.currentAnimationState === this.groundedState) {
            return "standingOnGround";
        } else if (this.currentAnimationState === this.seatedState) {
            return "seated";
        } else if (this.currentAnimationState === this.fallingState) {
            return "falling";
        } else {
            return "swimming";
        }
    }

    private querySurfaceBelow() {
        const up = this.getTransform().up;
        const rayStartOffset = 150;
        const rayDepth = 100;
        const start = this.getTransform().getAbsolutePosition().add(up.scale(rayStartOffset));
        const end = this.getTransform().getAbsolutePosition().add(up.scale(-rayDepth));
        this.physicsEngine.raycastToRef(start, end, this.raycastResult, {
            membership: CollisionMask.EVERYTHING,
            collideWith: CollisionMask.EVERYTHING & ~CollisionMask.AVATARS,
        });

        if (!this.raycastResult.hasHit) {
            return null;
        }

        const distance = this.raycastResult.hitDistance - rayStartOffset;
        if ((this.raycastResult.body?.shape?.filterMembershipMask ?? 0) & CollisionMask.WATER) {
            return {
                type: "water" as const,
                distance,
            };
        }

        return {
            type: "ground" as const,
            distance,
        };
    }

    private getCurrentAnimationState(): AnimationState {
        if (this.lastSurfaceInfo === null) {
            return this.fallingState;
        }

        if (this.lastSurfaceInfo.distance > 0.1) {
            return this.fallingState;
        }

        // start swimming when water is 1m above feet
        const waterLevelThreshold = 1;
        if (this.lastSurfaceInfo.type === "water" && this.lastSurfaceInfo.distance < -waterLevelThreshold) {
            return this.swimmingState;
        }

        return this.groundedState;
    }

    private handleGroundedState() {
        const forward = this.getTransform().forward;
        const up = this.getTransform().up;

        const linearVelocity = this.aggregate.body.getLinearVelocity();
        const verticalVelocityBackup = linearVelocity.dot(up);

        const newLinearVelocity = new Vector3();
        newLinearVelocity.addInPlace(
            forward.scale(
                this.runSpeed * this.runningAnim.weight +
                    this.walkSpeed * this.walkAnim.weight -
                    this.walkSpeedBackwards * this.walkBackAnim.weight,
            ),
        );
        newLinearVelocity.addInPlace(up.scale(verticalVelocityBackup));

        this.aggregate.body.setLinearVelocity(newLinearVelocity);
    }

    private handleSwimmingState() {
        const forward = this.getTransform().forward;
        this.aggregate.body.setLinearVelocity(forward.scale(this.swimSpeed * this.swimmingForwardAnim.weight));
    }

    public update(deltaSeconds: number): void {
        this.lastSurfaceInfo = this.querySurfaceBelow();

        // Do not fall through the ground
        if (
            this.lastSurfaceInfo !== null &&
            this.lastSurfaceInfo.type === "ground" &&
            this.lastSurfaceInfo.distance < 0
        ) {
            this.getTransform().position.addInPlace(
                this.getTransform().up.scale(Math.abs(this.lastSurfaceInfo.distance)),
            );
        }

        this.currentAnimationState = this.getCurrentAnimationState();

        switch (this.currentAnimationState) {
            case this.groundedState:
                this.handleGroundedState();
                break;
            case this.fallingState:
                break;
            case this.swimmingState:
                this.handleSwimmingState();
                break;
        }

        this.targetAnim = this.currentAnimationState.currentAnimation;

        let weightSum = 0;
        for (const animation of this.nonIdleAnimations) {
            if (animation === this.targetAnim) {
                animation.weight = moveTowards(animation.weight, 1, deltaSeconds);
            } else {
                animation.weight = moveTowards(animation.weight, 0, deltaSeconds);
            }
            weightSum += animation.weight;
        }

        this.currentAnimationState.idleAnimation.weight = moveTowards(
            this.currentAnimationState.idleAnimation.weight,
            Math.min(Math.max(1 - weightSum, 0.0), 1.0),
            deltaSeconds,
        );

        if (!this.isLookingAtTarget) {
            this.headLookController.target.copyFrom(
                this.getHeadPositionToRef(new Vector3()).addInPlace(this.getTransform().forward),
            );
        }
        this.headLookController.update();
    }

    public move(xMove: number, yMove: number, running: number): void {
        // Translation
        if (this.currentAnimationState === this.swimmingState) {
            this.swimmingState.currentAnimation = this.swimmingIdleAnim;
            if (yMove > 0) {
                this.swimmingState.currentAnimation = this.swimmingForwardAnim;
            }
        } else if (this.currentAnimationState === this.groundedState) {
            if (
                this.groundedState.currentAnimation !== this.danceAnim &&
                this.groundedState.currentAnimation !== this.sittingOnGroundIdleAnim
            ) {
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
            if (this.lastSurfaceInfo !== null && this.lastSurfaceInfo.distance < 30) {
                this.fallingState.currentAnimation = this.fallingIdleAnim;
            } else {
                this.fallingState.currentAnimation = this.skyDivingAnim;
            }
        } else if (this.currentAnimationState === this.seatedState) {
            this.seatedState.currentAnimation = this.sittingOnSeatIdleAnim;
            if (xMove !== 0 || yMove !== 0) {
                this.currentAnimationState = this.groundedState;
            }
        }
    }

    public dance() {
        this.groundedState.currentAnimation = this.danceAnim;
    }

    public sitOnGround() {
        this.groundedState.currentAnimation = this.sittingOnGroundIdleAnim;
    }

    public sitOnSeat() {
        this.currentAnimationState = this.seatedState;
    }

    public jump() {
        if (this.currentAnimationState !== this.groundedState) {
            return;
        }

        this.targetAnim = this.jumpingAnim;
        this.jumpingAnim.weight = 1;
        this.jumpingAnim.stop();
        this.jumpingAnim.play();

        this.aggregate.body.applyImpulse(
            this.getTransform().up.scale(this.mass * 50),
            this.getTransform().getAbsolutePosition(),
        );
    }

    public lookAt(target: Vector3 | null) {
        if (target === null) {
            this.isLookingAtTarget = false;
            return;
        }

        this.isLookingAtTarget = true;
        this.headLookController.target.copyFrom(target);
    }

    public getHeadPositionToRef(result: Vector3): Vector3 {
        const targetHead = this.instance.head;
        targetHead.bone.getAbsolutePositionToRef(targetHead.attachmentMesh, result);
        return result;
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

        this.headTransform.dispose();
        this.root.dispose();
    }
}
