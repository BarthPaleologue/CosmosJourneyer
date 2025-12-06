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
import type { Bone } from "@babylonjs/core/Bones/bone";
import type { Skeleton } from "@babylonjs/core/Bones/skeleton";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { err, ok, type Result } from "@/utils/types";

import { type ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { loadAssetInContainerAsync } from "./utils";

import defaultHumanoidPath from "@assets/character/character.glb";

export type HumanoidPrefabs = {
    default: HumanoidPrefab;
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

export async function loadHumanoidPrefabs(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<HumanoidPrefabs> {
    const defaultHumanoid = await loadAssetInContainerAsync(
        "DefaultHumanoid",
        defaultHumanoidPath,
        scene,
        progressMonitor,
    );

    const defaultHumanoidPrefab: HumanoidPrefab = {
        spawn: () => {
            const entries = defaultHumanoid.instantiateModelsToScene(undefined, true);
            const root = entries.rootNodes[0];
            if (root === undefined || !(root instanceof TransformNode)) {
                return err("DefaultHumanoid root node not found");
            }

            const animations = entries.animationGroups;

            const walkAnim = animations.find((a) => a.name.includes("WalkingForward"));
            if (walkAnim === undefined) return err("'WalkingForward' animation not found");

            const walkBackAnim = animations.find((a) => a.name.includes("WalkingBackwards"));
            if (walkBackAnim === undefined) return err("'WalkingBackwards' animation not found");

            const idleAnim = animations.find((a) => a.name.includes("WalkingIdle"));
            if (idleAnim === undefined) return err("'WalkingIdle' animation not found");

            const sambaAnim = animations.find((a) => a.name.includes("Samba"));
            if (sambaAnim === undefined) return err("'Samba' animation not found");

            const runningAnim = animations.find((a) => a.name.includes("Running"));
            if (runningAnim === undefined) return err("'Running' animation not found");

            const fallingIdleAnim = animations.find((a) => a.name.includes("FallingIdle"));
            if (fallingIdleAnim === undefined) return err("'FallingIdle' animation not found");

            const skyDivingAnim = animations.find((a) => a.name.includes("SkyDiving"));
            if (skyDivingAnim === undefined) return err("'SkyDiving' animation not found");

            const swimmingIdleAnim = animations.find((a) => a.name.includes("SwimmingIdle"));
            if (swimmingIdleAnim === undefined) return err("'SwimmingIdle' animation not found");

            const swimmingForwardAnim = animations.find((a) => a.name.includes("SwimmingForward"));
            if (swimmingForwardAnim === undefined) return err("'SwimmingForward' animation not found");

            const jumpingAnim = animations.find((a) => a.name.includes("Jumping"));
            if (jumpingAnim === undefined) return err("'Jumping' animation not found");

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
                    idle: idleAnim,
                    walk: walkAnim,
                    walkBackward: walkBackAnim,
                    dance: sambaAnim,
                    run: runningAnim,
                    swim: {
                        idle: swimmingIdleAnim,
                        forward: swimmingForwardAnim,
                    },
                    jump: jumpingAnim,
                    fall: fallingIdleAnim,
                    skyDive: skyDivingAnim,
                },
            });
        },
    };

    return {
        default: defaultHumanoidPrefab,
    };
}
