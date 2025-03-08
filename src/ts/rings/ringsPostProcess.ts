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

import ringsFragment from "../../shaders/ringsFragment.glsl";
import { Effect } from "@babylonjs/core/Materials/effect";
import { RingsSamplerNames, RingsUniformNames, RingsUniforms } from "./ringsUniform";
import { CelestialBodyModel } from "../architecture/orbitalObjectModel";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { ObjectUniformNames, setObjectUniforms } from "../postProcesses/uniforms/objectUniforms";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "../postProcesses/uniforms/stellarObjectUniforms";
import { CameraUniformNames, setCameraUniforms } from "../postProcesses/uniforms/cameraUniforms";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { SamplerUniformNames, setSamplerUniforms } from "../postProcesses/uniforms/samplerUniforms";
import { Transformable } from "../architecture/transformable";
import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { DeepReadonly } from "../utils/types";

export class RingsPostProcess extends PostProcess {
    readonly ringsUniforms: RingsUniforms;

    private activeCamera: Camera | null = null;

    constructor(
        bodyTransform: TransformNode,
        ringsUniforms: RingsUniforms,
        bodyModel: DeepReadonly<CelestialBodyModel>,
        stellarObjects: ReadonlyArray<Transformable>,
        scene: Scene
    ) {
        const shaderName = "rings";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = ringsFragment;
        }

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(RingsUniformNames)
        ];

        const samplers: string[] = [...Object.values(SamplerUniformNames), ...Object.values(RingsSamplerNames)];

        super(
            `${bodyModel.name}RingPostProcess`,
            shaderName,
            uniforms,
            samplers,
            1,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false,
            null,
            Constants.TEXTURETYPE_HALF_FLOAT
        );

        this.ringsUniforms = ringsUniforms;

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("RingsPostProcess: activeCamera is null");
            }

            setCameraUniforms(effect, this.activeCamera);
            setStellarObjectUniforms(effect, stellarObjects);
            setObjectUniforms(effect, bodyTransform, bodyModel.radius);

            this.ringsUniforms.setUniforms(effect);
            this.ringsUniforms.setSamplers(effect);

            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }
}
