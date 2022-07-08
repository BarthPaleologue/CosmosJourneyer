import { Effect } from "@babylonjs/core";
import { RingsSettings, ShaderDataType, ShaderSamplerData, ShaderUniformData } from "../interfaces";
import { PlanetPostProcess } from "../planetPostProcess";

import ringsFragment from "../../../shaders/ringsFragment.glsl";
import { AbstractBody } from "../../bodies/abstractBody";
import { StarSystemManager } from "../../bodies/starSystemManager";

const shaderName = "rings";
Effect.ShadersStore[`${shaderName}FragmentShader`] = ringsFragment;

export class RingsPostProcess extends PlanetPostProcess {
    settings: RingsSettings;

    constructor(name: string, body: AbstractBody, starSystem: StarSystemManager) {
        const settings: RingsSettings = {
            ringStart: 1.5,
            ringEnd: 2.5,
            ringFrequency: 30.0,
            ringOpacity: 0.4
        };

        const uniforms: ShaderUniformData = {
            ringStart: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.ringStart;
                }
            },
            ringEnd: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.ringEnd;
                }
            },
            ringFrequency: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.ringFrequency;
                }
            },
            ringOpacity: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.ringOpacity;
                }
            },

            planetRotationQuaternion: {
                type: ShaderDataType.Quaternion,
                get: () => {
                    return body.getRotationQuaternion();
                }
            }
        };

        const samplers: ShaderSamplerData = {};

        super(name, shaderName, uniforms, samplers, body, starSystem.stars[0], starSystem.scene);

        this.settings = settings;

        for (const pipeline of starSystem.pipelines) {
            pipeline.rings.push(this);
        }
    }
}
