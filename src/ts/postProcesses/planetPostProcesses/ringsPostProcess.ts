import { Effect, Scene } from "@babylonjs/core";
import { RingsSettings, ShaderDataType, ShaderSamplerData, ShaderUniformData } from "../interfaces";
import { PlanetPostProcess } from "../planetPostProcess";
import { Star } from "../../celestialBodies/stars/star";

import ringsFragment from "../../../shaders/ringsFragment.glsl";
import { AbstractBody } from "../../celestialBodies/abstractBody";

const shaderName = "rings";
Effect.ShadersStore[`${shaderName}FragmentShader`] = ringsFragment;

export class RingsPostProcess extends PlanetPostProcess {
    settings: RingsSettings;

    constructor(name: string, body: AbstractBody, sun: Star, scene: Scene) {
        let settings: RingsSettings = {
            ringStart: 1.5,
            ringEnd: 2.5,
            ringFrequency: 30.0,
            ringOpacity: 0.4
        };

        let uniforms: ShaderUniformData = {
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

            planetWorldMatrix: {
                type: ShaderDataType.Matrix,
                get: () => {
                    return body.getWorldMatrix();
                }
            }
        };

        let samplers: ShaderSamplerData = {};

        super(name, shaderName, uniforms, samplers, body, sun, scene);

        this.settings = settings;
    }
}
