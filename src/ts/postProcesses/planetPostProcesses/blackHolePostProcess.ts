import { Effect } from "@babylonjs/core";

import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "../interfaces";
import { PlanetPostProcess } from "../planetPostProcess";

import blackHoleFragment from "../../../shaders/blackhole.glsl";
import { UberScene } from "../../core/uberScene";
import { AbstractBody } from "../../bodies/abstractBody";
import { StarSystem } from "../../bodies/starSystem";

const shaderName = "blackhole";
Effect.ShadersStore[`${shaderName}FragmentShader`] = blackHoleFragment;

export interface BlackHoleSettings {
    accretionDiskRadius: number;
    rotationPeriod: number;
}

export class BlackHolePostProcess extends PlanetPostProcess {
    settings: BlackHoleSettings;

    constructor(name: string, planet: AbstractBody, scene: UberScene, starSystem: StarSystem) {
        const settings: BlackHoleSettings = {
            accretionDiskRadius: 8000e3,
            rotationPeriod: 1.5
        };

        const uniforms: ShaderUniforms = [
            {
                name: "time",
                type: ShaderDataType.Float,
                get: () => {
                    return this.internalTime % (settings.rotationPeriod*10000);
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

        const samplers: ShaderSamplers = [];

        super(name, shaderName, uniforms, samplers, planet, scene, starSystem);

        this.settings = settings;

        for (const pipeline of scene.pipelines) {
            pipeline.blackHoles.push(this);
        }
    }
}
