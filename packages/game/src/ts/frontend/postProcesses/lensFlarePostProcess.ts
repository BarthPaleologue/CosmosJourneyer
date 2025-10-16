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

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Matrix } from "@babylonjs/core/Maths/math";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { type PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { type Scene } from "@babylonjs/core/scene";

import type { RGBColor } from "@/utils/colors";
import { moveTowards } from "@/utils/math";

import { CameraUniformNames, setCameraUniforms } from "./uniforms/cameraUniforms";
import { ObjectUniformNames, setObjectUniforms } from "./uniforms/objectUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "./uniforms/samplerUniforms";

import lensFlareFragment from "@shaders/lensflare.glsl";

export type LensFlareSettings = {
    visibility: number;
    behindCamera: boolean;
    clipPosition: Vector3;
};

export class LensFlarePostProcess extends PostProcess {
    readonly settings: LensFlareSettings;

    private activeCamera: Camera | null = null;

    constructor(stellarTransform: TransformNode, boundingRadius: number, color: RGBColor, scene: Scene) {
        const shaderName = "lensflare";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = lensFlareFragment;
        }

        const settings: LensFlareSettings = {
            visibility: 1,
            behindCamera: false,
            clipPosition: new Vector3(),
        };

        const LensFlareUniformNames = {
            FLARE_COLOR: "flareColor",
            CLIP_POSITION: "clipPosition",
            VISIBILITY: "visibility",
            ASPECT_RATIO: "aspectRatio",
        };

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(LensFlareUniformNames),
        ];

        const samplers: string[] = Object.values(SamplerUniformNames);

        super(
            stellarTransform.name + "LensFlare",
            shaderName,
            uniforms,
            samplers,
            1,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false,
            null,
            Constants.TEXTURETYPE_HALF_FLOAT,
        );

        this.settings = settings;

        const flareColor = color;

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            const floatingOriginOffset = scene.floatingOriginOffset;

            setCameraUniforms(effect, this.activeCamera);
            setObjectUniforms(effect, stellarTransform, boundingRadius, floatingOriginOffset);

            effect.setColor3(LensFlareUniformNames.FLARE_COLOR, flareColor);

            const clipPosition = Vector3.Project(
                stellarTransform.getAbsolutePosition(),
                Matrix.IdentityReadOnly,
                scene.getTransformMatrix(),
                this.activeCamera.viewport,
            );
            settings.behindCamera = clipPosition.z < 0;
            effect.setVector3(LensFlareUniformNames.CLIP_POSITION, clipPosition);

            const raycastResult = new PhysicsRaycastResult();
            const start = this.activeCamera.globalPosition;
            const end = stellarTransform.getAbsolutePosition();
            (scene.getPhysicsEngine() as PhysicsEngineV2).raycastToRef(start, end, raycastResult);
            const occulted = raycastResult.hasHit && raycastResult.body?.transformNode !== stellarTransform;

            const isNotVisible = occulted || settings.behindCamera;

            if (isNotVisible && settings.visibility > 0) {
                settings.visibility = moveTowards(settings.visibility, 0, 0.5);
            } else if (!isNotVisible && settings.visibility < 1) {
                settings.visibility = moveTowards(settings.visibility, 1, 0.5);
            }
            effect.setFloat(LensFlareUniformNames.VISIBILITY, settings.visibility);

            effect.setFloat(LensFlareUniformNames.ASPECT_RATIO, scene.getEngine().getScreenAspectRatio());

            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }
}
