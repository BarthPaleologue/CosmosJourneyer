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

import shadowFragment from "../../shaders/shadowFragment.glsl";
import { UberScene } from "../uberCore/uberScene";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { ObjectPostProcess } from "./objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { SamplerEnumType, ShaderSamplers, ShaderUniforms, UniformEnumType } from "../uberCore/postProcesses/types";
import { PostProcessType } from "./postProcessTypes";
import { RingsUniforms } from "./rings/ringsUniform";
import { Assets } from "../assets";
import { CelestialBody } from "../architecture/celestialBody";
import { StellarObject } from "../architecture/stellarObject";

export type ShadowUniforms = {
    hasRings: boolean;
    hasClouds: boolean;
    hasOcean: boolean;
};

export class ShadowPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly object: CelestialBody;
    readonly shadowUniforms: ShadowUniforms;

    public static async CreateAsync(body: CelestialBody, scene: UberScene, stellarObjects: StellarObject[]): Promise<ShadowPostProcess> {
        const shaderName = "shadow";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = shadowFragment;
        }

        const shadowUniforms: ShadowUniforms = {
            hasRings: body.getRingsUniforms() !== null,
            hasClouds: body.postProcesses.includes(PostProcessType.CLOUDS),
            hasOcean: body.postProcesses.includes(PostProcessType.OCEAN)
        };
        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(body),
            ...getStellarObjectsUniforms(stellarObjects),
            ...getActiveCameraUniforms(scene),
            {
                name: "star_radiuses",
                type: UniformEnumType.FLOAT_ARRAY,
                get: () => stellarObjects.map((star) => star.getBoundingRadius())
            },
            {
                name: "shadowUniforms_hasRings",
                type: UniformEnumType.BOOL,
                get: () => {
                    return shadowUniforms.hasRings;
                }
            },
            {
                name: "shadowUniforms_hasClouds",
                type: UniformEnumType.BOOL,
                get: () => {
                    return shadowUniforms.hasClouds;
                }
            },
            {
                name: "shadowUniforms_hasOcean",
                type: UniformEnumType.BOOL,
                get: () => {
                    return shadowUniforms.hasOcean;
                }
            }
        ];

        if (shadowUniforms.hasRings) {
            const ringsUniforms = body.getRingsUniforms();
            if (ringsUniforms === null) throw new Error("shadowUniforms.hasRings is true and yet body.getRingsUniforms() returned null!");
            uniforms.push(...ringsUniforms.getShaderUniforms());

            return ringsUniforms.getShaderSamplers(scene).then((ringSamplers) => {
                const samplers: ShaderSamplers = [...getSamplers(scene), ...ringSamplers];
                return new ShadowPostProcess(body.name + "Shadow", body, scene, shaderName, uniforms, samplers, shadowUniforms);
            });
        } else {
            uniforms.push(...RingsUniforms.GetEmptyShaderUniforms());
            const samplers: ShaderSamplers = [
                ...getSamplers(scene),
                {
                    name: "rings_lut",
                    type: SamplerEnumType.TEXTURE,
                    get: () => {
                        return Assets.EMPTY_TEXTURE;
                    }
                }
            ];
            return new ShadowPostProcess(body.name + "Shadow", body, scene, shaderName, uniforms, samplers, shadowUniforms);
        }
    }

    private constructor(
        name: string,
        body: CelestialBody,
        scene: UberScene,
        shaderName: string,
        uniforms: ShaderUniforms,
        samplers: ShaderSamplers,
        shadowUniforms: ShadowUniforms
    ) {
        super(name, shaderName, uniforms, samplers, scene);

        this.object = body;
        this.shadowUniforms = shadowUniforms;
    }
}
