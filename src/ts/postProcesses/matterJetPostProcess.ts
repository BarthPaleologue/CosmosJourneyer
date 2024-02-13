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

import matterJetFragment from "../../shaders/matterjet.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers } from "./uniforms";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ObjectPostProcess, UpdatablePostProcess } from "./objectPostProcess";
import { UniformEnumType, ShaderSamplers, ShaderUniforms } from "../uberCore/postProcesses/types";
import { StellarObject } from "../architecture/stellarObject";

export interface MatterJetUniforms {
    // the rotation period in seconds of the matter jet
    rotationPeriod: number;
    time: number;
}

/**
 * Post process for rendering matter jets that are used by neutron stars for example
 */
export class MatterJetPostProcess extends UberPostProcess implements ObjectPostProcess, UpdatablePostProcess {
    matterJetUniforms: MatterJetUniforms;
    object: StellarObject;

    constructor(name: string, stellarObject: StellarObject, scene: UberScene) {
        const shaderName = "matterjet";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = matterJetFragment;
        }

        const settings: MatterJetUniforms = {
            rotationPeriod: 1.5,
            time: 0
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(stellarObject),
            ...getActiveCameraUniforms(scene),
            {
                name: "time",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return settings.time % (settings.rotationPeriod * 10000);
                }
            },
            {
                name: "rotationPeriod",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return settings.rotationPeriod;
                }
            },
            {
                name: "rotationAxis",
                type: UniformEnumType.VECTOR_3,
                get: () => {
                    return stellarObject.getRotationAxis();
                }
            }
        ];

        const samplers: ShaderSamplers = [...getSamplers(scene)];

        super(name, shaderName, uniforms, samplers, scene);

        this.object = stellarObject;
        this.matterJetUniforms = settings;
    }

    public update(deltaTime: number): void {
        this.matterJetUniforms.time += deltaTime;
    }
}
