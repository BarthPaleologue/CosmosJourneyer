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

import mandelbulbFragment from "../../shaders/mandelbulb.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { ObjectPostProcess } from "./objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { UniformEnumType, ShaderSamplers, ShaderUniforms } from "../uberCore/postProcesses/types";
import { Mandelbulb } from "../mandelbulb/mandelbulb";
import { StellarObject } from "../architecture/stellarObject";

export interface MandelbulbSettings {
    rotationPeriod: number;
}

export class MandelbulbPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly settings: MandelbulbSettings;
    readonly object: Mandelbulb;

    constructor(mandelbulb: Mandelbulb, scene: UberScene, stellarObjects: StellarObject[]) {
        const shaderName = "mandelbulb";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = mandelbulbFragment;
        }

        const settings: MandelbulbSettings = {
            rotationPeriod: 1.5
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(mandelbulb),
            ...getStellarObjectsUniforms(stellarObjects),
            ...getActiveCameraUniforms(scene),
            {
                name: "power",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return mandelbulb.model.power;
                }
            },
            {
                name: "accentColor",
                type: UniformEnumType.COLOR_3,
                get: () => {
                    return mandelbulb.model.accentColor;
                }
            }
        ];

        const samplers: ShaderSamplers = [...getSamplers(scene)];

        super(mandelbulb.name, shaderName, uniforms, samplers, scene);

        this.object = mandelbulb;
        this.settings = settings;
    }
}
