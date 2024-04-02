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

import blackHoleFragment from "../../shaders/blackhole.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers } from "./uniforms";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { ObjectPostProcess } from "./objectPostProcess";
import { Assets } from "../assets";
import { Effect } from "@babylonjs/core/Materials/effect";
import { getForwardDirection } from "../uberCore/transforms/basicTransform";
import { UniformEnumType, ShaderSamplers, ShaderUniforms, SamplerEnumType } from "../uberCore/postProcesses/types";
import { Matrix, Quaternion } from "@babylonjs/core/Maths/math";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";

export type BlackHoleUniforms = {
    accretionDiskRadius: number;
    rotationPeriod: number;
    warpingMinkowskiFactor: number;
    time: number;
};

export class BlackHolePostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly blackHoleUniforms: BlackHoleUniforms;
    readonly object: BlackHole;

    constructor(blackHole: BlackHole, scene: UberScene, starfieldRotation: Quaternion) {
        const shaderName = "blackhole";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = blackHoleFragment;
        }

        const blackHoleUniforms: BlackHoleUniforms = {
            accretionDiskRadius: blackHole.model.physicalProperties.accretionDiskRadius,
            rotationPeriod: 1.5,
            warpingMinkowskiFactor: 2.0,
            time: 0
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(blackHole),
            ...getActiveCameraUniforms(scene),
            {
                name: "starfieldRotation",
                type: UniformEnumType.MATRIX,
                get: () => {
                    const rotationMatrix = new Matrix();
                    starfieldRotation.toRotationMatrix(rotationMatrix);
                    return rotationMatrix;
                }
            },
            {
                name: "time",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return blackHoleUniforms.time % (blackHoleUniforms.rotationPeriod * 10000);
                }
            },
            {
                name: "accretionDiskRadius",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return blackHoleUniforms.accretionDiskRadius;
                }
            },
            {
                name: "warpingMinkowskiFactor",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return blackHoleUniforms.warpingMinkowskiFactor;
                }
            },
            {
                name: "rotationPeriod",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return blackHoleUniforms.rotationPeriod;
                }
            },
            {
                name: "rotationAxis",
                type: UniformEnumType.VECTOR_3,
                get: () => {
                    return blackHole.getRotationAxis();
                }
            },
            {
                name: "forwardAxis",
                type: UniformEnumType.VECTOR_3,
                get: () => {
                    return getForwardDirection(blackHole.getTransform());
                }
            }
        ];

        const samplers: ShaderSamplers = [
            ...getSamplers(scene),
            {
                name: "starfieldTexture",
                type: SamplerEnumType.TEXTURE,
                get: () => {
                    return Assets.STAR_FIELD;
                }
            }
        ];

        super(blackHole.name, shaderName, uniforms, samplers, scene);

        this.object = blackHole;
        this.blackHoleUniforms = blackHoleUniforms;
    }

    public update(deltaTime: number): void {
        this.blackHoleUniforms.time += deltaTime;
    }
}
