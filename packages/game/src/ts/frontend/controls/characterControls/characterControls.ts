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

import "@babylonjs/core/Collisions/collisionCoordinator";

import { type AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { type Skeleton } from "@babylonjs/core/Bones/skeleton";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { type Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Axis, Quaternion, Space } from "@babylonjs/core/Maths/math";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { type PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { type Scene } from "@babylonjs/core/scene";

import { setUpVector, translate } from "@/frontend/helpers/transform";
import { type Transformable } from "@/frontend/universe/architecture/transformable";
import { TelluricPlanet } from "@/frontend/universe/planets/telluricPlanet/telluricPlanet";

import { CollisionMask, Settings } from "@/settings";

import { type Controls } from "../";
import { CharacterInputs } from "./characterControlsInputs";

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

export class CharacterControls implements Controls {
    readonly character: AbstractMesh;

    readonly characterNode: AbstractMesh;

    readonly skeleton: Skeleton;

    readonly headTransform: TransformNode;

    readonly firstPersonCamera: FreeCamera;
    readonly thirdPersonCamera: ArcRotateCamera;
    private activeCamera: Camera;

    private readonly characterWalkSpeed = 1.8;
    private readonly characterWalkSpeedBackwards = 1.2;
    private readonly characterRunSpeed = 3.6;
    private readonly characterRotationSpeed = 6;
    private readonly characterSwimSpeed = 1.5;

    private readonly idleAnim: AnimationGroupWrapper;
    private readonly walkAnim: AnimationGroupWrapper;
    private readonly walkBackAnim: AnimationGroupWrapper;
    private readonly sambaAnim: AnimationGroupWrapper;
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

    private closestWalkableObject: Transformable | null = null;
    private distanceToGround = 0;

    private readonly raycastResult = new PhysicsRaycastResult();
    private readonly scene: Scene;

    private jumpVelocity = Vector3.Zero();

    constructor(character: AbstractMesh, scene: Scene) {
        this.scene = scene;

        this.character = character;
        this.getTransform().rotationQuaternion = Quaternion.Identity();

        const walkAnim = scene.getAnimationGroupByName("WalkingForward");
        if (walkAnim === null) throw new Error("'WalkingForward' animation not found");

        const walkBackAnim = scene.getAnimationGroupByName("WalkingBackwards");
        if (walkBackAnim === null) throw new Error("'WalkingBackwards' animation not found");

        const idleAnim = scene.getAnimationGroupByName("WalkingIdle");
        if (idleAnim === null) throw new Error("'WalkingIdle' animation not found");

        const sambaAnim = scene.getAnimationGroupByName("Samba");
        if (sambaAnim === null) throw new Error("'Samba' animation not found");

        const runningAnim = scene.getAnimationGroupByName("Running");
        if (runningAnim === null) throw new Error("'Running' animation not found");

        const fallingIdleAnim = scene.getAnimationGroupByName("FallingIdle");
        if (fallingIdleAnim === null) throw new Error("'FallingIdle' animation not found");

        const skyDivingAnim = scene.getAnimationGroupByName("SkyDiving");
        if (skyDivingAnim === null) throw new Error("'SkyDiving' animation not found");

        const swimmingIdleAnim = scene.getAnimationGroupByName("SwimmingIdle");
        if (swimmingIdleAnim === null) throw new Error("'SwimmingIdle' animation not found");

        const swimmingForwardAnim = scene.getAnimationGroupByName("SwimmingForward");
        if (swimmingForwardAnim === null) throw new Error("'SwimmingForward' animation not found");

        const jumpingAnim = scene.getAnimationGroupByName("Jumping");
        if (jumpingAnim === null) throw new Error("'Jumping' animation not found");

        this.idleAnim = new AnimationGroupWrapper("idle", idleAnim, 1, true);
        this.walkAnim = new AnimationGroupWrapper("walk", walkAnim, 0, true);
        this.walkBackAnim = new AnimationGroupWrapper("walkBack", walkBackAnim, 0, true);
        this.sambaAnim = new AnimationGroupWrapper("samba", sambaAnim, 0, true);
        this.runningAnim = new AnimationGroupWrapper("running", runningAnim, 0, true);
        this.fallingIdleAnim = new AnimationGroupWrapper("fallingIdle", fallingIdleAnim, 0, true);
        this.skyDivingAnim = new AnimationGroupWrapper("skydiving", skyDivingAnim, 0, true);
        this.swimmingIdleAnim = new AnimationGroupWrapper("swimming", swimmingIdleAnim, 0, true);
        this.swimmingForwardAnim = new AnimationGroupWrapper("swimmingForward", swimmingForwardAnim, 0, true);
        this.jumpingAnim = new AnimationGroupWrapper("jumping", jumpingAnim, 0, false);
        this.nonIdleAnimations = [
            this.walkAnim,
            this.walkBackAnim,
            this.sambaAnim,
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
            this.sambaAnim,
            this.runningAnim,
        ]);
        this.fallingState = new AnimationState(this.fallingIdleAnim, [this.skyDivingAnim]);
        this.swimmingState = new AnimationState(this.swimmingIdleAnim, [this.swimmingForwardAnim]);
        this.currentAnimationState = this.groundedState;

        this.targetAnim = this.idleAnim;

        this.firstPersonCamera = new FreeCamera("characterFirstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.speed = 0;
        this.firstPersonCamera.minZ = 1;
        this.firstPersonCamera.parent = this.getTransform();

        const skeleton = this.character.getChildMeshes().find((mesh) => mesh.skeleton !== null)?.skeleton;
        if (skeleton === undefined || skeleton === null) throw new Error("Skeleton not found");

        this.skeleton = skeleton;

        const characterNode = this.character.getChildMeshes().find((mesh) => mesh.name.includes("Alpha_Joints"));
        if (characterNode === undefined) {
            throw new Error("Could not find the Alpha_Joints node in the character mesh");
        }
        this.characterNode = characterNode;

        const headBoneIndex = skeleton.getBoneIndexByName("mixamorig:HeadTop_End");
        const headBone = skeleton.bones[headBoneIndex];
        if (headBone === undefined) {
            throw new Error("Could not find the head bone in the skeleton");
        }

        this.headTransform = new TransformNode("headTransform", scene);
        this.headTransform.scaling.scaleInPlace(20);
        this.headTransform.attachToBone(headBone, characterNode);

        this.thirdPersonCamera = new ArcRotateCamera(
            "characterThirdPersonCamera",
            -1.0,
            Math.PI / 3,
            10,
            new Vector3(0, 1.5, 0),
            scene,
        );
        this.thirdPersonCamera.lowerRadiusLimit = 2;
        this.thirdPersonCamera.upperRadiusLimit = 500;
        this.thirdPersonCamera.minZ = 1;
        this.thirdPersonCamera.maxZ = Settings.EARTH_RADIUS * 5;
        this.thirdPersonCamera.wheelPrecision *= 3;
        this.thirdPersonCamera.parent = this.getTransform();

        this.activeCamera = this.firstPersonCamera;
        this.setFirstPersonCameraActive();

        CharacterInputs.map.toggleCamera.on("complete", () => {
            if (this.getActiveCamera() === this.thirdPersonCamera) {
                this.setFirstPersonCameraActive();
            } else {
                this.setThirdPersonCameraActive();
            }
        });
    }

    public setFirstPersonCameraActive() {
        this.activeCamera = this.firstPersonCamera;
        this.character.getChildMeshes().forEach((mesh) => {
            mesh.setEnabled(false);
        });
    }

    public setThirdPersonCameraActive() {
        this.activeCamera = this.thirdPersonCamera;
        this.character.getChildMeshes().forEach((mesh) => {
            mesh.setEnabled(true);
        });
    }

    public setClosestWalkableObject(object: Transformable | null) {
        this.closestWalkableObject = object;
    }

    public getActiveCamera(): Camera {
        return this.activeCamera;
    }

    public getCameras(): Camera[] {
        return [this.firstPersonCamera, this.thirdPersonCamera];
    }

    public getTransform(): TransformNode {
        return this.character;
    }

    public shouldLockPointer(): boolean {
        return true;
    }

    public update(deltaSeconds: number): Vector3 {
        const inverseTransform = this.getTransform().getWorldMatrix().clone().invert();
        this.firstPersonCamera.position = Vector3.TransformCoordinates(
            this.headTransform.getAbsolutePosition(),
            inverseTransform,
        );

        this.getTransform().rotate(Axis.Y, this.firstPersonCamera.rotation.y - Math.PI, Space.LOCAL);
        this.getTransform().computeWorldMatrix(true);
        this.firstPersonCamera.rotation.y = Math.PI;
        this.firstPersonCamera.getViewMatrix(true);

        const character = this.getTransform();
        const start = character.getAbsolutePosition().add(character.up.scale(50e3));
        const end = character.position.add(character.up.scale(-50e3));

        if (this.currentAnimationState === this.fallingState) {
            // apply gravity
            this.jumpVelocity.addInPlace(character.up.scale(-9.8 * deltaSeconds));
            translate(character, this.jumpVelocity.scale(deltaSeconds));
        }

        if (this.closestWalkableObject !== null) {
            const up = character
                .getAbsolutePosition()
                .subtract(this.closestWalkableObject.getTransform().getAbsolutePosition())
                .normalize();
            setUpVector(character, up);
        }

        (this.scene.getPhysicsEngine() as PhysicsEngineV2).raycastToRef(start, end, this.raycastResult, {
            collideWith: CollisionMask.ENVIRONMENT,
        });
        if (this.raycastResult.hasHit) {
            const up = character.up;
            let distance = Vector3.Dot(character.getAbsolutePosition().subtract(this.raycastResult.hitPointWorld), up);

            // if closestWalkableObject is a telluric planet, the distance is the min between the distance to the ground and the distance to the water level
            if (this.closestWalkableObject !== null && this.closestWalkableObject instanceof TelluricPlanet) {
                const waterLevel =
                    (this.closestWalkableObject.model.ocean?.depth ?? 0) + this.closestWalkableObject.getRadius();
                const distanceToWater =
                    Vector3.Distance(
                        this.getTransform().getAbsolutePosition(),
                        this.closestWalkableObject.getTransform().getAbsolutePosition(),
                    ) - waterLevel;
                distance = Math.min(distance, distanceToWater + 1.3);
            }

            if (distance <= 0.1) {
                // push the character up if it's below the surface
                translate(character, up.scale(-distance));

                if (this.closestWalkableObject !== null && this.closestWalkableObject instanceof TelluricPlanet) {
                    const waterLevel =
                        (this.closestWalkableObject.model.ocean?.depth ?? 0) + this.closestWalkableObject.getRadius();
                    const distanceToWater =
                        Vector3.Distance(
                            this.getTransform().getAbsolutePosition(),
                            this.closestWalkableObject.getTransform().getAbsolutePosition(),
                        ) - waterLevel;
                    if (distanceToWater < 0) {
                        this.currentAnimationState = this.swimmingState;
                    } else {
                        this.currentAnimationState = this.groundedState;
                    }
                } else {
                    this.currentAnimationState = this.groundedState;
                }
                this.distanceToGround = 0;
                this.jumpVelocity = Vector3.Zero();
            } else {
                this.currentAnimationState = this.fallingState;
                this.distanceToGround = distance;
            }
        } else {
            this.currentAnimationState = this.fallingState;
            this.distanceToGround = 50e3;
        }

        const displacement = Vector3.Zero();

        if (this.walkAnim.weight > 0.0) {
            this.character.moveWithCollisions(
                this.character.forward.scaleInPlace(-this.characterWalkSpeed * deltaSeconds * this.walkAnim.weight),
            );
        }

        if (this.walkBackAnim.weight > 0.0) {
            this.character.moveWithCollisions(
                this.character.forward.scaleInPlace(
                    this.characterWalkSpeedBackwards * deltaSeconds * this.walkBackAnim.weight,
                ),
            );
        }

        if (this.runningAnim.weight > 0.0) {
            this.character.moveWithCollisions(
                this.character.forward.scaleInPlace(-this.characterRunSpeed * deltaSeconds * this.runningAnim.weight),
            );
        }

        const [xMove, yMove] = CharacterInputs.map.move.value;

        // Translation
        if (this.currentAnimationState === this.swimmingState) {
            this.swimmingState.currentAnimation = this.swimmingIdleAnim;
            if (yMove > 0) {
                this.swimmingState.currentAnimation = this.swimmingForwardAnim;
                this.character.moveWithCollisions(
                    this.character.forward.scaleInPlace(-this.characterSwimSpeed * deltaSeconds),
                );
            }
        } else if (this.currentAnimationState === this.groundedState) {
            this.groundedState.currentAnimation = this.idleAnim;
            if (yMove > 0) {
                this.groundedState.currentAnimation = this.walkAnim;
            } else if (yMove < 0) {
                this.groundedState.currentAnimation = this.walkBackAnim;
            } else if (CharacterInputs.map.run.value > 0) {
                this.groundedState.currentAnimation = this.runningAnim;
            }

            // Samba!
            if (CharacterInputs.map.samba.value > 0) {
                this.groundedState.currentAnimation = this.sambaAnim;
            }

            if (CharacterInputs.map.jump.state === "complete") {
                this.targetAnim = this.jumpingAnim;
                this.jumpingAnim.weight = 1;
                this.jumpingAnim.group.stop();
                this.jumpingAnim.group.play();
                this.currentAnimationState = this.fallingState;
                this.jumpVelocity = this.character.up.scale(10.0).add(this.character.forward.scale(-5.0));
            }
        } else if (this.currentAnimationState === this.fallingState) {
            if (this.distanceToGround < 30) {
                this.fallingState.currentAnimation = this.fallingIdleAnim;
            } else {
                this.fallingState.currentAnimation = this.skyDivingAnim;
            }
        }

        this.targetAnim = this.currentAnimationState.currentAnimation;

        const isMoving = this.currentAnimationState.currentAnimation !== this.currentAnimationState.idleAnimation;

        // Rotation
        if (this.activeCamera === this.thirdPersonCamera && isMoving) {
            const dtheta = -Math.sign(xMove) * this.characterRotationSpeed * deltaSeconds;
            this.character.rotate(Vector3.Up(), dtheta);
            this.thirdPersonCamera.alpha += dtheta;

            const cameraPosition = this.thirdPersonCamera.target;
            cameraPosition.applyRotationQuaternionInPlace(Quaternion.RotationAxis(Vector3.Up(), -dtheta));
            this.thirdPersonCamera.target = cameraPosition;
        } else if (this.activeCamera === this.firstPersonCamera) {
            displacement.addInPlace(this.character.right.scale(xMove * this.characterWalkSpeed * deltaSeconds));
        }

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

        this.character.computeWorldMatrix(true);

        translate(this.getTransform(), displacement);

        this.getActiveCamera().getViewMatrix();

        return displacement;
    }

    dispose() {
        this.character.dispose();
        this.firstPersonCamera.dispose();
        this.thirdPersonCamera.dispose();
    }
}
