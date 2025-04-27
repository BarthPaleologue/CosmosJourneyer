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

import { Effect } from "@babylonjs/core/Materials/effect";

import oceanFragment from "../../shaders/oceanFragment.glsl";
import { UpdatablePostProcess } from "../postProcesses/updatablePostProcess";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { CameraUniformNames, setCameraUniforms } from "../postProcesses/uniforms/cameraUniforms";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "../postProcesses/uniforms/stellarObjectUniforms";
import { ObjectUniformNames, setObjectUniforms } from "../postProcesses/uniforms/objectUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "../postProcesses/uniforms/samplerUniforms";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { OceanUniforms } from "./oceanUniforms";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { WaterTextures } from "../assets/textures";

export class OceanPostProcess extends PostProcess implements UpdatablePostProcess {
    readonly planetTransform: TransformNode;

    readonly oceanUniforms: OceanUniforms;

    private activeCamera: Camera | null = null;

    constructor(
        planetTransform: TransformNode,
        boundingRadius: number,
        oceanUniforms: OceanUniforms,
        stellarObjects: ReadonlyArray<PointLight>,
        oceanTextures: WaterTextures,
        scene: Scene
    ) {
        const shaderName = "ocean";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = oceanFragment;
        }

        const uniforms: string[] = [
            ...Object.values(CameraUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(ObjectUniformNames),
            ...oceanUniforms.getUniformNames()
        ];

        const samplers: string[] = [...Object.values(SamplerUniformNames), ...oceanUniforms.getSamplerNames()];

        super(
            `${planetTransform.name}OceanPostProcess`,
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

        this.planetTransform = planetTransform;
        this.oceanUniforms = oceanUniforms;

        this.onActivateObservable.add((camera) => (this.activeCamera = camera));

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            setCameraUniforms(effect, this.activeCamera);
            setStellarObjectUniforms(effect, stellarObjects);
            setObjectUniforms(effect, planetTransform, boundingRadius);

            oceanUniforms.setUniforms(effect, planetTransform);

            setSamplerUniforms(effect, this.activeCamera, scene);
            oceanUniforms.setSamplers(effect, oceanTextures);
        });
    }

    public update(deltaTime: number) {
        this.oceanUniforms.time += deltaTime;
    }
}
