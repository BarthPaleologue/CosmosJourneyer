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

import { Animation } from "@babylonjs/core/Animations/animation";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import type { Bone } from "@babylonjs/core/Bones/bone";
import type { Skeleton } from "@babylonjs/core/Bones/skeleton";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";
import { err, ok, type Result } from "@cosmos-journeyer/typescript";

import { type ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { loadAssetInContainerAsync } from "./utils";

import astronautHumanoidPath from "@assets/character/astronaut.glb";
import defaultHumanoidPath from "@assets/character/character.glb";

export type HumanoidPrefabs = {
    placeholder: HumanoidPrefab;
    astronaut: HumanoidPrefab;
};

export type HumanoidAnimations = {
    idle: AnimationGroup;
    walk: AnimationGroup;
    walkBackward: AnimationGroup;
    dance: AnimationGroup;
    run: AnimationGroup;
    swim: {
        idle: AnimationGroup;
        forward: AnimationGroup;
    };
    jump: AnimationGroup;
    fall: AnimationGroup;
    skyDive: AnimationGroup;
    sittingOnGroundIdle: AnimationGroup;
    sittingOnSeatIdle: AnimationGroup;
    sittingOnSeatToStandingIdle: AnimationGroup;
    standingIdleToSittingOnSeat: AnimationGroup;
};

export type HumanoidInstance = {
    root: TransformNode;
    head: {
        bone: Bone;
        attachmentMesh: AbstractMesh;
    };
    skeleton: Skeleton;
    animations: HumanoidAnimations;
};

export interface HumanoidPrefab {
    spawn(): Result<HumanoidInstance, string>;
}

const armClearanceAxis = new Vector3(0, 1, 0);

const astronautArmClearanceAdjustments = {
    leftShoulder: Quaternion.RotationAxis(armClearanceAxis, -0.326),
    rightShoulder: Quaternion.RotationAxis(armClearanceAxis, 0.326),
    leftArm: Quaternion.RotationAxis(armClearanceAxis, -0.158),
    rightArm: Quaternion.RotationAxis(armClearanceAxis, 0.158),
} as const;

const astronautLocomotionArmClearance = 0.65;

function getAnimationTargetName(target: unknown): string | undefined {
    if (typeof target !== "object" || target === null || !("name" in target)) {
        return undefined;
    }

    const name = target.name;
    return typeof name === "string" ? name : undefined;
}

function scaleQuaternionAngle(rotation: Quaternion, scale: number): Quaternion {
    return Quaternion.Slerp(Quaternion.Identity(), rotation, scale);
}

function applyLocalRotationOffset(animationGroup: AnimationGroup, nodeName: string, rotationOffset: Quaternion): void {
    for (const targetedAnimation of animationGroup.targetedAnimations) {
        const targetName = getAnimationTargetName(targetedAnimation.target);
        if (targetName !== nodeName && targetName?.endsWith(` ${nodeName}`) !== true) {
            continue;
        }

        const animation = targetedAnimation.animation;
        if (
            animation.dataType !== Animation.ANIMATIONTYPE_QUATERNION ||
            animation.targetPropertyPath.at(-1) !== "rotationQuaternion"
        ) {
            continue;
        }

        animation.setKeys(
            animation.getKeys().map((key) => {
                const value: unknown = key.value;
                if (!(value instanceof Quaternion)) {
                    return key;
                }

                return {
                    ...key,
                    value: value.multiply(rotationOffset),
                };
            }),
        );
    }
}

function applyArmClearanceAdjustment(animationGroup: AnimationGroup, strength: number): void {
    applyLocalRotationOffset(
        animationGroup,
        "mixamorig:LeftShoulder",
        scaleQuaternionAngle(astronautArmClearanceAdjustments.leftShoulder, strength),
    );
    applyLocalRotationOffset(
        animationGroup,
        "mixamorig:RightShoulder",
        scaleQuaternionAngle(astronautArmClearanceAdjustments.rightShoulder, strength),
    );
    applyLocalRotationOffset(
        animationGroup,
        "mixamorig:LeftArm",
        scaleQuaternionAngle(astronautArmClearanceAdjustments.leftArm, strength),
    );
    applyLocalRotationOffset(
        animationGroup,
        "mixamorig:RightArm",
        scaleQuaternionAngle(astronautArmClearanceAdjustments.rightArm, strength),
    );
}

function applyAstronautAnimationPostProcessing(animations: HumanoidAnimations): void {
    applyArmClearanceAdjustment(animations.idle, 1);
    applyArmClearanceAdjustment(animations.walk, astronautLocomotionArmClearance);
    applyArmClearanceAdjustment(animations.walkBackward, astronautLocomotionArmClearance);
    applyArmClearanceAdjustment(animations.run, astronautLocomotionArmClearance);
    applyArmClearanceAdjustment(animations.sittingOnGroundIdle, astronautLocomotionArmClearance * 0.5);
}

export async function loadHumanoidPrefabs(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor,
): Promise<HumanoidPrefabs> {
    const defaultHumanoidPromise = loadAssetInContainerAsync(
        "DefaultHumanoid",
        defaultHumanoidPath,
        scene,
        progressMonitor,
    );

    const astronautHumanoidPromise = loadAssetInContainerAsync(
        "AstronautHumanoid",
        astronautHumanoidPath,
        scene,
        progressMonitor,
    );

    const [defaultHumanoid, astronautHumanoid] = await Promise.all([defaultHumanoidPromise, astronautHumanoidPromise]);

    const defaultHumanoidPrefab: HumanoidPrefab = {
        spawn: () => {
            const entries = defaultHumanoid.instantiateModelsToScene(undefined, true);
            const root = entries.rootNodes[0];
            if (root === undefined || !(root instanceof TransformNode)) {
                return err("DefaultHumanoid root node not found");
            }

            const animationGroups = entries.animationGroups;

            const findAnimation = (namePart: string): Result<AnimationGroup, string> => {
                const anim = animationGroups.find((a) => a.name.includes(namePart));
                if (anim === undefined) {
                    return err(`'${namePart}' animation not found`);
                }
                return ok(anim);
            };

            const walkAnim = findAnimation("Walking Forward");
            if (!walkAnim.success) return walkAnim;

            const walkBackAnim = findAnimation("Walking Backward");
            if (!walkBackAnim.success) return walkBackAnim;
            const idleAnim = findAnimation("Standing Idle");
            if (!idleAnim.success) return idleAnim;

            const sambaAnim = findAnimation("Samba Dancing");
            if (!sambaAnim.success) return sambaAnim;

            const runningAnim = findAnimation("Running");
            if (!runningAnim.success) return runningAnim;
            const fallingIdleAnim = findAnimation("Falling Idle");
            if (!fallingIdleAnim.success) return fallingIdleAnim;

            const skyDivingAnim = findAnimation("Sky Diving");
            if (!skyDivingAnim.success) return skyDivingAnim;

            const swimmingIdleAnim = findAnimation("Swimming Idle");
            if (!swimmingIdleAnim.success) return swimmingIdleAnim;

            const swimmingForwardAnim = findAnimation("Swimming Forward");
            if (!swimmingForwardAnim.success) return swimmingForwardAnim;

            const jumpingAnim = findAnimation("Jumping");
            if (!jumpingAnim.success) return jumpingAnim;

            const sittingOnGroundIdleAnim = findAnimation("Sitting On Ground Idle");
            if (!sittingOnGroundIdleAnim.success) return sittingOnGroundIdleAnim;

            const sittingOnSeatIdleAnim = findAnimation("Sitting On Seat Idle");
            if (!sittingOnSeatIdleAnim.success) return sittingOnSeatIdleAnim;

            const standingIdleToSittingOnSeatAnim = findAnimation("Stand To Sit");
            if (!standingIdleToSittingOnSeatAnim.success) return standingIdleToSittingOnSeatAnim;

            const sittingOnSeatToStandingIdleAnim = findAnimation("Sit To Stand");
            if (!sittingOnSeatToStandingIdleAnim.success) return sittingOnSeatToStandingIdleAnim;

            const skeleton = entries.skeletons[0];
            if (skeleton === undefined) {
                return err("DefaultHumanoid skeleton not found");
            }

            const headBoneIndex = skeleton.getBoneIndexByName("mixamorig:Head");
            const headBone = skeleton.bones[headBoneIndex];
            if (headBone === undefined) {
                return err("Could not find the head bone in the skeleton");
            }

            const headAttachmentMesh = root
                .getChildMeshes()
                .find((mesh): mesh is AbstractMesh => mesh.skeleton === skeleton);
            if (headAttachmentMesh === undefined) {
                return err("Could not find a mesh bound to the humanoid skeleton");
            }

            return ok({
                root,
                skeleton,
                head: {
                    bone: headBone,
                    attachmentMesh: headAttachmentMesh,
                },
                animations: {
                    idle: idleAnim.value,
                    walk: walkAnim.value,
                    walkBackward: walkBackAnim.value,
                    dance: sambaAnim.value,
                    run: runningAnim.value,
                    swim: {
                        idle: swimmingIdleAnim.value,
                        forward: swimmingForwardAnim.value,
                    },
                    jump: jumpingAnim.value,
                    fall: fallingIdleAnim.value,
                    skyDive: skyDivingAnim.value,
                    sittingOnGroundIdle: sittingOnGroundIdleAnim.value,
                    sittingOnSeatIdle: sittingOnSeatIdleAnim.value,
                    sittingOnSeatToStandingIdle: sittingOnSeatToStandingIdleAnim.value,
                    standingIdleToSittingOnSeat: standingIdleToSittingOnSeatAnim.value,
                },
            });
        },
    };

    const astronautHumanoidPrefab: HumanoidPrefab = {
        spawn: () => {
            const entries = astronautHumanoid.instantiateModelsToScene(undefined, true);
            const root = entries.rootNodes[0];
            if (root === undefined || !(root instanceof TransformNode)) {
                return err("Astronaut humanoid root node not found");
            }

            const animationGroups = entries.animationGroups;

            const findAnimation = (namePart: string): Result<AnimationGroup, string> => {
                const anim = animationGroups.find((a) => a.name.includes(namePart));
                if (anim === undefined) {
                    return err(`'${namePart}' animation not found`);
                }
                return ok(anim);
            };

            const walkAnim = findAnimation("Walking Forward");
            if (!walkAnim.success) return walkAnim;

            const walkBackAnim = findAnimation("Walking Backward");
            if (!walkBackAnim.success) return walkBackAnim;
            const idleAnim = findAnimation("Standing Idle");
            if (!idleAnim.success) return idleAnim;

            const sambaAnim = findAnimation("Samba Dancing");
            if (!sambaAnim.success) return sambaAnim;

            const runningAnim = findAnimation("Running");
            if (!runningAnim.success) return runningAnim;
            const fallingIdleAnim = findAnimation("Falling Idle");
            if (!fallingIdleAnim.success) return fallingIdleAnim;

            const skyDivingAnim = findAnimation("Sky Diving");
            if (!skyDivingAnim.success) return skyDivingAnim;

            const swimmingIdleAnim = findAnimation("Swimming Idle");
            if (!swimmingIdleAnim.success) return swimmingIdleAnim;

            const swimmingForwardAnim = findAnimation("Swimming Forward");
            if (!swimmingForwardAnim.success) return swimmingForwardAnim;

            const jumpingAnim = findAnimation("Jumping");
            if (!jumpingAnim.success) return jumpingAnim;

            const sittingOnGroundIdleAnim = findAnimation("Sitting On Ground Idle");
            if (!sittingOnGroundIdleAnim.success) return sittingOnGroundIdleAnim;

            const sittingOnSeatIdleAnim = findAnimation("Sitting On Seat Idle");
            if (!sittingOnSeatIdleAnim.success) return sittingOnSeatIdleAnim;

            const standingIdleToSittingOnSeatAnim = findAnimation("Stand To Sit");
            if (!standingIdleToSittingOnSeatAnim.success) return standingIdleToSittingOnSeatAnim;

            const sittingOnSeatToStandingIdleAnim = findAnimation("Sit To Stand");
            if (!sittingOnSeatToStandingIdleAnim.success) return sittingOnSeatToStandingIdleAnim;

            const skeleton = entries.skeletons[0];
            if (skeleton === undefined) {
                return err("Astronaut humanoid skeleton not found");
            }

            const headBoneIndex = skeleton.getBoneIndexByName("mixamorig:Head");
            const headBone = skeleton.bones[headBoneIndex];
            if (headBone === undefined) {
                return err("Could not find the head bone in the skeleton");
            }

            const headAttachmentMesh = root
                .getChildMeshes()
                .find((mesh): mesh is AbstractMesh => mesh.skeleton === skeleton);
            if (headAttachmentMesh === undefined) {
                return err("Could not find a mesh bound to the humanoid skeleton");
            }

            const animations: HumanoidAnimations = {
                idle: idleAnim.value,
                walk: walkAnim.value,
                walkBackward: walkBackAnim.value,
                dance: sambaAnim.value,
                run: runningAnim.value,
                swim: {
                    idle: swimmingIdleAnim.value,
                    forward: swimmingForwardAnim.value,
                },
                jump: jumpingAnim.value,
                fall: fallingIdleAnim.value,
                skyDive: skyDivingAnim.value,
                sittingOnGroundIdle: sittingOnGroundIdleAnim.value,
                sittingOnSeatIdle: sittingOnSeatIdleAnim.value,
                sittingOnSeatToStandingIdle: sittingOnSeatToStandingIdleAnim.value,
                standingIdleToSittingOnSeat: standingIdleToSittingOnSeatAnim.value,
            };

            applyAstronautAnimationPostProcessing(animations);

            return ok({
                root,
                skeleton,
                head: {
                    bone: headBone,
                    attachmentMesh: headAttachmentMesh,
                },
                animations,
            });
        },
    };

    return {
        placeholder: defaultHumanoidPrefab,
        astronaut: astronautHumanoidPrefab,
    };
}
