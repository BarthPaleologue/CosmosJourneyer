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

import matterJetFragment from "../../shaders/matterjet.glsl";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ObjectPostProcess, UpdatablePostProcess } from "./objectPostProcess";
import { StellarObject } from "../architecture/stellarObject";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { ObjectUniformNames, setObjectUniforms } from "./uniforms/objectUniforms";
import { CameraUniformNames, setCameraUniforms } from "./uniforms/cameraUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "./uniforms/samplerUniforms";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Scene } from "@babylonjs/core/scene";

export type MatterJetUniforms = {
    // the rotation period in seconds of the matter jet
    rotationPeriod: number;
    time: number;
};

/**
 * Post process for rendering matter jets that are used by neutron stars for example
 */
export class MatterJetPostProcess extends PostProcess implements ObjectPostProcess, UpdatablePostProcess {
    matterJetUniforms: MatterJetUniforms;
    object: StellarObject;

    private activeCamera: Camera | null = null;

    constructor(stellarObject: StellarObject, scene: Scene) {
        const shaderName = "matterjet";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = matterJetFragment;
        }

        const settings: MatterJetUniforms = {
            rotationPeriod: 1.5,
            time: 0
        };

        const MatterJetUniformNames = {
            TIME: "time",
            ROTATION_PERIOD: "rotationPeriod",
            ROTATION_AXIS: "rotationAxis"
        };

        const uniforms: string[] = [...Object.values(ObjectUniformNames), ...Object.values(CameraUniformNames), ...Object.values(MatterJetUniformNames)];

        const samplers: string[] = Object.values(SamplerUniformNames);

        super(`${stellarObject.model.name}MatterJetPostProcess`, shaderName, uniforms, samplers, 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, null, Constants.TEXTURETYPE_HALF_FLOAT);

        this.object = stellarObject;
        this.matterJetUniforms = settings;

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            setCameraUniforms(effect, this.activeCamera);
            setObjectUniforms(effect, stellarObject);

            effect.setFloat(MatterJetUniformNames.TIME, this.matterJetUniforms.time % (this.matterJetUniforms.rotationPeriod * 10000));
            effect.setFloat(MatterJetUniformNames.ROTATION_PERIOD, this.matterJetUniforms.rotationPeriod);
            effect.setVector3(MatterJetUniformNames.ROTATION_AXIS, stellarObject.getRotationAxis());

            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }

    public update(deltaTime: number): void {
        this.matterJetUniforms.time += deltaTime;
    }
}
