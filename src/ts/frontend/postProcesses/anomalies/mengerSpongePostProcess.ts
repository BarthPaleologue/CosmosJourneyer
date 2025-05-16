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

import { Camera } from "@babylonjs/core/Cameras/camera";
import { Constants } from "@babylonjs/core/Engines/constants";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { Scene } from "@babylonjs/core/scene";

import { MengerSpongeModel } from "@/backend/universe/orbitalObjects/mengerSpongeModel";

import { DeepReadonly } from "@/utils/types";

import { CameraUniformNames, setCameraUniforms } from "../../postProcesses/uniforms/cameraUniforms";
import { ObjectUniformNames, setObjectUniforms } from "../../postProcesses/uniforms/objectUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "../../postProcesses/uniforms/samplerUniforms";
import {
    setStellarObjectUniforms,
    StellarObjectUniformNames,
} from "../../postProcesses/uniforms/stellarObjectUniforms";
import { UpdatablePostProcess } from "../../postProcesses/updatablePostProcess";

import mengerSpongeFragment from "@shaders/mengerSponge.glsl";

export class MengerSpongePostProcess extends PostProcess implements UpdatablePostProcess {
    private elapsedSeconds = 0;

    private activeCamera: Camera | null = null;

    constructor(
        transform: TransformNode,
        boundingRadius: number,
        model: DeepReadonly<MengerSpongeModel>,
        scene: Scene,
        stellarObjects: ReadonlyArray<PointLight>,
    ) {
        const shaderName = "MengerSponge";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = mengerSpongeFragment;
        }

        const MengerSpongeUniformNames = {
            ACCENT_COLOR: "accentColor",
            ELAPSED_SECONDS: "elapsedSeconds",
            AVERAGE_SCREEN_SIZE: "averageScreenSize",
        };

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(MengerSpongeUniformNames),
        ];

        const samplers: string[] = Object.values(SamplerUniformNames);

        super(
            transform.name,
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

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            setCameraUniforms(effect, this.activeCamera);
            setStellarObjectUniforms(effect, stellarObjects);
            setObjectUniforms(effect, transform, boundingRadius);

            effect.setColor3(MengerSpongeUniformNames.ACCENT_COLOR, model.color);
            effect.setFloat(MengerSpongeUniformNames.ELAPSED_SECONDS, this.elapsedSeconds);
            effect.setFloat(
                MengerSpongeUniformNames.AVERAGE_SCREEN_SIZE,
                (scene.getEngine().getRenderWidth() + scene.getEngine().getRenderHeight()) / 2,
            );

            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }

    public update(deltaSeconds: number): void {
        this.elapsedSeconds += deltaSeconds;
    }
}
