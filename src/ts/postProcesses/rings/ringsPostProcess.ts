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

import ringsFragment from "../../../shaders/ringsFragment.glsl";
import { UberScene } from "../../uberCore/uberScene";
import { UberPostProcess } from "../../uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "../uniforms";
import { ObjectPostProcess } from "../objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderSamplers, ShaderUniforms } from "../../uberCore/postProcesses/types";
import { RingsUniforms } from "./ringsUniform";
import { CelestialBody } from "../../architecture/celestialBody";
import { Transformable } from "../../architecture/transformable";

export class RingsPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly ringsUniforms: RingsUniforms;
    readonly object: CelestialBody;

    public static async CreateAsync(body: CelestialBody, scene: UberScene, stellarObjects: Transformable[]): Promise<RingsPostProcess> {
        const shaderName = "rings";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = ringsFragment;
        }

        const ringsUniforms = body.getRingsUniforms();
        if (ringsUniforms === null)
            throw new Error(
                `RingsPostProcess: ringsUniforms are null. This should not be possible as the postprocess should not be created if the body has no rings. Body: ${body.name}`
            );
        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(body),
            ...getStellarObjectsUniforms(stellarObjects),
            ...getActiveCameraUniforms(scene),
            ...ringsUniforms.getShaderUniforms()
        ];

        return ringsUniforms.getShaderSamplers(scene).then((ringSamplers) => {
            const samplers: ShaderSamplers = [...getSamplers(scene), ...ringSamplers];
            return new RingsPostProcess(body.name + "Rings", shaderName, uniforms, samplers, scene, body, ringsUniforms);
        });
    }

    private constructor(name: string, shaderName: string, uniforms: ShaderUniforms, samplers: ShaderSamplers, scene: UberScene, body: CelestialBody, ringsUniforms: RingsUniforms) {
        super(name, shaderName, uniforms, samplers, scene);

        this.object = body;
        this.ringsUniforms = ringsUniforms;
    }
}
