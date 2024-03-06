//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import lensFlareFragment from "../../shaders/lensflare.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers } from "./uniforms";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { ObjectPostProcess } from "./objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderSamplers, ShaderUniforms, UniformEnumType } from "../uberCore/postProcesses/types";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { moveTowards } from "../utils/moveTowards";
import { Star } from "../stellarObjects/star/star";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { Matrix } from "@babylonjs/core/Maths/math";
import { StellarObject } from "../architecture/stellarObject";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export type LensFlareSettings = {
    visibility: number;
    behindCamera: boolean;
    clipPosition: Vector3;
};

export class LensFlarePostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly settings: LensFlareSettings;
    readonly object: StellarObject;

    constructor(object: StellarObject, scene: UberScene) {
        const shaderName = "lensflare";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = lensFlareFragment;
        }

        const settings: LensFlareSettings = {
            visibility: 1,
            behindCamera: false,
            clipPosition: new Vector3()
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(object),
            ...getActiveCameraUniforms(scene),
            {
                name: "flareColor",
                type: UniformEnumType.COLOR_3,
                get: () => {
                    if (object instanceof Star) return object.model.color;
                    else return new Color3(1, 1, 1);
                }
            },
            {
                name: "clipPosition",
                type: UniformEnumType.VECTOR_3,
                get: () => {
                    if (scene.activeCamera === null) throw new Error("no camera");
                    const clipPosition = Vector3.Project(
                        object.getTransform().getAbsolutePosition(),
                        Matrix.IdentityReadOnly,
                        scene.getTransformMatrix(),
                        scene.activeCamera.viewport
                    );
                    settings.behindCamera = clipPosition.z < 0;
                    return clipPosition;
                }
            },
            {
                name: "visibility",
                type: UniformEnumType.FLOAT,
                get: () => {
                    if (scene.activeCamera === null) throw new Error("no camera");
                    // send raycast from camera to object and check early intersections
                    const raycastResult = new PhysicsRaycastResult();
                    const start = scene.activeCamera.globalPosition;
                    const end = object.getTransform().getAbsolutePosition();
                    (scene.getPhysicsEngine() as PhysicsEngineV2).raycastToRef(start, end, raycastResult);
                    const occulted = raycastResult.hasHit && raycastResult.body?.transformNode !== object.getTransform();

                    const isNotVisible = occulted || settings.behindCamera;

                    if (isNotVisible && settings.visibility > 0) {
                        settings.visibility = moveTowards(settings.visibility, 0, 0.5);
                    } else if (!isNotVisible && settings.visibility < 1) {
                        settings.visibility = moveTowards(settings.visibility, 1, 0.5);
                    }

                    return settings.visibility;
                }
            },
            {
                name: "aspectRatio",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return scene.getEngine().getScreenAspectRatio();
                }
            }
        ];

        const samplers: ShaderSamplers = [...getSamplers(scene)];

        super(object.name + "LensFlare", shaderName, uniforms, samplers, scene);

        this.object = object;
        this.settings = settings;
    }
}
