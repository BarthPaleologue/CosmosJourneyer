//  This file is part of CosmosJourneyer
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

import volumetricCloudsFragment from "../../shaders/volumetricCloudsFragment.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { ObjectPostProcess } from "./objectPostProcess";
import { FlatCloudsPostProcess } from "./clouds/flatCloudsPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { UniformEnumType, ShaderSamplers, ShaderUniforms } from "../uberCore/postProcesses/types";
import { CloudsUniforms } from "./clouds/cloudsUniforms";

import { BoundingSphere } from "../architecture/boundingSphere";
import { Transformable } from "../architecture/transformable";
import { StellarObject } from "../architecture/stellarObject";

export type CloudsPostProcess = FlatCloudsPostProcess | VolumetricCloudsPostProcess;

export class VolumetricCloudsPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly cloudUniforms: CloudsUniforms;
    readonly object: Transformable;

    constructor(name: string, planet: Transformable & BoundingSphere, cloudsUniforms: CloudsUniforms, scene: UberScene, stars: StellarObject[]) {
        const shaderName = "volumetricClouds";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = volumetricCloudsFragment;
        }

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(planet),
            ...getStellarObjectsUniforms(stars),
            ...getActiveCameraUniforms(scene),
            {
                name: "cloudLayerMinHeight",
                type: UniformEnumType.Float,
                get: () => {
                    return planet.getBoundingRadius();
                }
            },
            {
                name: "cloudLayerMaxHeight",
                type: UniformEnumType.Float,
                get: () => {
                    return planet.getBoundingRadius() + 30e3;
                }
            }
        ];

        const samplers: ShaderSamplers = getSamplers(scene);

        super(name, shaderName, uniforms, samplers, scene);

        this.object = planet;
        this.cloudUniforms = cloudsUniforms;
    }
}
