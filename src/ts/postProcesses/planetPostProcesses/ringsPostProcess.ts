import { Effect } from "@babylonjs/core";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "../interfaces";
import { PlanetPostProcess } from "../planetPostProcess";

import ringsFragment from "../../../shaders/ringsFragment.glsl";
import { AbstractBody } from "../../bodies/abstractBody";
import { StarSystemManager } from "../../bodies/starSystemManager";

const shaderName = "rings";
Effect.ShadersStore[`${shaderName}FragmentShader`] = ringsFragment;

export interface RingsSettings {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
}

export class RingsPostProcess extends PlanetPostProcess {
    settings: RingsSettings;

    constructor(name: string, body: AbstractBody, starSystem: StarSystemManager) {
        const settings: RingsSettings = {
            ringStart: 1.5,
            ringEnd: 2.5,
            ringFrequency: 30.0,
            ringOpacity: 0.4
        };

        const uniforms: ShaderUniforms = [
            {
                name: "ringStart",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.ringStart;
                }
            },
            {
                name: "ringEnd",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.ringEnd;
                }
            },
            {
                name: "ringFrequency",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.ringFrequency;
                }
            },
            {
                name: "ringOpacity",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.ringOpacity;
                }
            },
            {
                name: "planetRotationQuaternion",
                type: ShaderDataType.Quaternion,
                get: () => {
                    return body.getRotationQuaternion();
                }
            }
        ];

        const samplers: ShaderSamplers = [];

        super(name, shaderName, uniforms, samplers, body, starSystem.stars[0], starSystem);

        this.settings = settings;

        for (const pipeline of starSystem.pipelines) {
            pipeline.rings.push(this);
        }
    }
}
