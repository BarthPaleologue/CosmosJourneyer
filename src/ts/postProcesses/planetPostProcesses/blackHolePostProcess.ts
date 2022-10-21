import { Effect } from "@babylonjs/core";

import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "../interfaces";

import blackHoleFragment from "../../../shaders/blackhole.glsl";
import { UberScene } from "../../core/uberScene";
import { AbstractBody } from "../../bodies/abstractBody";
import { getActiveCameraUniforms, getBodyUniforms, getSamplers } from "../uniforms";
import { UberPostProcess } from "../uberPostProcess";

const shaderName = "blackhole";
Effect.ShadersStore[`${shaderName}FragmentShader`] = blackHoleFragment;

export interface BlackHoleSettings {
    accretionDiskRadius: number;
    rotationPeriod: number;
}

export class BlackHolePostProcess extends UberPostProcess {
    settings: BlackHoleSettings;

    constructor(name: string, planet: AbstractBody, scene: UberScene) {
        const settings: BlackHoleSettings = {
            accretionDiskRadius: 8000e3,
            rotationPeriod: 1.5
        };

        const uniforms: ShaderUniforms = [
            ...getBodyUniforms(planet),
            ...getActiveCameraUniforms(scene),
            {
                name: "time",
                type: ShaderDataType.Float,
                get: () => {
                    return this.internalTime % (settings.rotationPeriod * 10000);
                }
            },
            {
                name: "accretionDiskRadius",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.accretionDiskRadius;
                }
            },
            {
                name: "rotationPeriod",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.rotationPeriod;
                }
            }
        ];

        const samplers: ShaderSamplers = getSamplers(scene);

        super(name, shaderName, uniforms, samplers, scene);

        this.settings = settings;

        scene.uberRenderingPipeline.blackHoles.push(this);

    }
}
