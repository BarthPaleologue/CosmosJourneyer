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
import { type PointLight } from "@babylonjs/core/Lights/pointLight";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { type Scene } from "@babylonjs/core/scene";

import { type WaterTextures } from "@/frontend/assets/textures";

import { CameraUniformNames, setCameraUniforms } from "../uniforms/cameraUniforms";
import { ObjectUniformNames, setObjectUniforms } from "../uniforms/objectUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "../uniforms/samplerUniforms";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "../uniforms/stellarObjectUniforms";
import { type UpdatablePostProcess } from "../updatablePostProcess";
import { type OceanUniforms } from "./oceanUniforms";

import oceanFragment from "@shaders/oceanFragment.glsl";

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
        scene: Scene,
    ) {
        const shaderName = "ocean";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = oceanFragment;
        }

        const uniforms: string[] = [
            ...Object.values(CameraUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(ObjectUniformNames),
            ...oceanUniforms.getUniformNames(),
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
            Constants.TEXTURETYPE_HALF_FLOAT,
        );

        this.planetTransform = planetTransform;
        this.oceanUniforms = oceanUniforms;

        this.onActivateObservable.add((camera) => (this.activeCamera = camera));

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                console.warn("Camera is null");
                return;
            }

            const floatingOriginOffset = scene.floatingOriginOffset;
            const floatingOriginEnabled = scene.floatingOriginMode;

            setCameraUniforms(effect, this.activeCamera, floatingOriginEnabled);
            setStellarObjectUniforms(effect, stellarObjects, floatingOriginOffset);
            setObjectUniforms(effect, planetTransform, boundingRadius, floatingOriginOffset);

            oceanUniforms.setUniforms(effect, planetTransform);

            setSamplerUniforms(effect, this.activeCamera, scene);
            oceanUniforms.setSamplers(effect, oceanTextures);
        });
    }

    public update(deltaTime: number) {
        this.oceanUniforms.time += deltaTime;
    }
}
