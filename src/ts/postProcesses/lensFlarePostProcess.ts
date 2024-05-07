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
import { ObjectPostProcess } from "./objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { moveTowards } from "../utils/moveTowards";
import { Star } from "../stellarObjects/star/star";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { Matrix } from "@babylonjs/core/Maths/math";
import { StellarObject } from "../architecture/stellarObject";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { ObjectUniformNames, setObjectUniforms } from "./uniforms/objectUniforms";
import { CameraUniformNames, setCameraUniforms } from "./uniforms/cameraUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "./uniforms/samplerUniforms";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Camera } from "@babylonjs/core/Cameras/camera";

export type LensFlareSettings = {
    visibility: number;
    behindCamera: boolean;
    clipPosition: Vector3;
};

export class LensFlarePostProcess extends PostProcess implements ObjectPostProcess {
    readonly settings: LensFlareSettings;
    readonly object: StellarObject;

    private activeCamera: Camera | null = null;

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

        const LensFlareUniformNames = {
            FLARE_COLOR: "flareColor",
            CLIP_POSITION: "clipPosition",
            VISIBILITY: "visibility",
            ASPECT_RATIO: "aspectRatio"
        }

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(LensFlareUniformNames)
        ];

        const samplers: string[] = Object.values(SamplerUniformNames);

        super(object.name + "LensFlare", shaderName, uniforms, samplers, 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, null, Constants.TEXTURETYPE_HALF_FLOAT);

        this.object = object;
        this.settings = settings;

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if(this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            setCameraUniforms(effect, this.activeCamera);
            setObjectUniforms(effect, object);

            effect.setColor3(LensFlareUniformNames.FLARE_COLOR, object instanceof Star ? object.model.color : new Color3(1, 1, 1));

            const clipPosition = Vector3.Project(
                object.getTransform().getAbsolutePosition(),
                Matrix.IdentityReadOnly,
                scene.getTransformMatrix(),
                this.activeCamera.viewport
            );
            settings.behindCamera = clipPosition.z < 0;
            effect.setVector3(LensFlareUniformNames.CLIP_POSITION, clipPosition);

            const raycastResult = new PhysicsRaycastResult();
            const start = this.activeCamera.globalPosition;
            const end = object.getTransform().getAbsolutePosition();
            (scene.getPhysicsEngine() as PhysicsEngineV2).raycastToRef(start, end, raycastResult);
            const occulted = raycastResult.hasHit && raycastResult.body?.transformNode !== object.getTransform();

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
