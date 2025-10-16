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
import { Matrix } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { type Scene } from "@babylonjs/core/scene";

import { CameraUniformNames, setCameraUniforms } from "./uniforms/cameraUniforms";
import { ObjectUniformNames, setObjectUniforms } from "./uniforms/objectUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "./uniforms/samplerUniforms";
import { type UpdatablePostProcess } from "./updatablePostProcess";

import matterJetFragment from "@shaders/matterjet.glsl";

export type MatterJetUniforms = {
    elapsedSeconds: number;
    inverseRotation: Matrix;
    dipoleTilt: number;
};

/**
 * Post process for rendering matter jets that are used by neutron stars for example
 */
export class MatterJetPostProcess extends PostProcess implements UpdatablePostProcess {
    readonly matterJetUniforms: MatterJetUniforms;

    private activeCamera: Camera | null = null;

    constructor(stellarTransform: TransformNode, boundingRadius: number, dipoleTilt: number, scene: Scene) {
        const shaderName = "matterjet";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = matterJetFragment;
        }

        const settings: MatterJetUniforms = {
            elapsedSeconds: 0,
            inverseRotation: Matrix.Identity(),
            dipoleTilt: dipoleTilt,
        };

        const MatterJetUniformNames = {
            TIME: "time",
            INVERSE_ROTATION: "inverseRotation",
            DIPOLE_TILT: "dipoleTilt",
        };

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(MatterJetUniformNames),
        ];

        const samplers: string[] = Object.values(SamplerUniformNames);

        super(
            `${stellarTransform.name}MatterJetPostProcess`,
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

        this.matterJetUniforms = settings;

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

            effect.setFloat(MatterJetUniformNames.TIME, this.matterJetUniforms.elapsedSeconds % 10000);

            stellarTransform.getWorldMatrix().getRotationMatrixToRef(this.matterJetUniforms.inverseRotation);
            this.matterJetUniforms.inverseRotation.transposeToRef(this.matterJetUniforms.inverseRotation);

            effect.setMatrix(MatterJetUniformNames.INVERSE_ROTATION, this.matterJetUniforms.inverseRotation);

            effect.setFloat(MatterJetUniformNames.DIPOLE_TILT, this.matterJetUniforms.dipoleTilt);

            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }

    public update(deltaSeconds: number): void {
        this.matterJetUniforms.elapsedSeconds += deltaSeconds;
    }
}
