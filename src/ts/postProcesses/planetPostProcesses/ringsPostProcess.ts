import { Effect } from "@babylonjs/core";
import { ShaderDataType, ShaderUniforms } from "../interfaces";

import ringsFragment from "../../../shaders/ringsFragment.glsl";
import { AbstractBody } from "../../bodies/abstractBody";
import { UberScene } from "../../core/uberScene";
import { StarSystem } from "../../bodies/starSystem";
import { UberPostProcess } from "../uberPostProcess";
import { getActiveCameraUniforms, getBodyUniforms, getSamplers, getStarsUniforms } from "../uniforms";

const shaderName = "rings";
Effect.ShadersStore[`${shaderName}FragmentShader`] = ringsFragment;

interface RingsSettings {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
}

export class RingsPostProcess extends UberPostProcess {
    settings: RingsSettings = {
        ringStart: 1.5,
        ringEnd: 2.5,
        ringFrequency: 30.0,
        ringOpacity: 0.4
    };

    constructor(name: string, body: AbstractBody, scene: UberScene, starSystem: StarSystem) {
        const uniforms: ShaderUniforms = [
            ...getBodyUniforms(body),
            ...getStarsUniforms(starSystem),
            ...getActiveCameraUniforms(scene),
            {
                name: "ringStart",
                type: ShaderDataType.Float,
                get: () => {
                    return this.settings.ringStart;
                }
            },
            {
                name: "ringEnd",
                type: ShaderDataType.Float,
                get: () => {
                    return this.settings.ringEnd;
                }
            },
            {
                name: "ringFrequency",
                type: ShaderDataType.Float,
                get: () => {
                    return this.settings.ringFrequency;
                }
            },
            {
                name: "ringOpacity",
                type: ShaderDataType.Float,
                get: () => {
                    return this.settings.ringOpacity;
                }
            },
            {
                name: "planetRotationAxis",
                type: ShaderDataType.Vector3,
                get: () => {
                    return body.getRotationAxis();
                }
            }
        ];

        super(name, shaderName, uniforms, getSamplers(scene), scene);

        for (const pipeline of scene.pipelines) {
            pipeline.rings.push(this);
        }
    }
}
