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

import { Effect } from "@babylonjs/core/Materials/effect";

import flatCloudsFragment from "../../../shaders/flatCloudsFragment.glsl";
import { UberScene } from "../../uberCore/uberScene";
import { UberPostProcess } from "../../uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "../uniforms";
import { ObjectPostProcess, UpdatablePostProcess } from "../objectPostProcess";
import { ShaderSamplers, ShaderUniforms } from "../../uberCore/postProcesses/types";
import { Transformable } from "../../architecture/transformable";
import { CloudsUniforms } from "./cloudsUniforms";
import { BoundingSphere } from "../../architecture/boundingSphere";

export class FlatCloudsPostProcess extends UberPostProcess implements ObjectPostProcess, UpdatablePostProcess {
    readonly cloudUniforms: CloudsUniforms;
    readonly object: Transformable;

    public static async CreateAsync(
        name: string,
        planet: Transformable & BoundingSphere,
        cloudsUniforms: CloudsUniforms,
        scene: UberScene,
        stellarObjects: Transformable[]
    ): Promise<FlatCloudsPostProcess> {
        const shaderName = "flatClouds";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = flatCloudsFragment;
        }

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(planet),
            ...getStellarObjectsUniforms(stellarObjects),
            ...getActiveCameraUniforms(scene),
            ...cloudsUniforms.getShaderUniforms()
        ];

        return cloudsUniforms.getShaderSamplers(scene).then((cloudSamplers) => {
            const samplers: ShaderSamplers = [...getSamplers(scene), ...cloudSamplers];
            return new FlatCloudsPostProcess(name, shaderName, planet, cloudsUniforms, uniforms, samplers, scene);
        });
    }

    private constructor(
        name: string,
        shaderName: string,
        planet: Transformable,
        cloudUniforms: CloudsUniforms,
        uniforms: ShaderUniforms,
        samplers: ShaderSamplers,
        scene: UberScene
    ) {
        super(name, shaderName, uniforms, samplers, scene);

        this.object = planet;
        this.cloudUniforms = cloudUniforms;
    }

    public update(deltaTime: number): void {
        this.cloudUniforms.time += deltaTime;
    }
}
