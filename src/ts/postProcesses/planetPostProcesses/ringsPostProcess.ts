import { Effect } from "@babylonjs/core";
import { ShaderDataType, ShaderUniforms } from "../interfaces";

import ringsFragment from "../../../shaders/ringsFragment.glsl";
import { AbstractBody } from "../../bodies/abstractBody";
import { UberScene } from "../../core/uberScene";
import { StarSystem } from "../../bodies/starSystem";
import { UberPostProcess } from "../uberPostProcess";
import { getActiveCameraUniforms, getBodyUniforms, getSamplers, getStarsUniforms } from "../uniforms";
import { randRange } from "extended-random";

const shaderName = "rings";
Effect.ShadersStore[`${shaderName}FragmentShader`] = ringsFragment;

interface RingsSettings {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
}

export class RingsPostProcess extends UberPostProcess {
    settings: RingsSettings;

    constructor(name: string, body: AbstractBody, scene: UberScene, starSystem: StarSystem) {
        const settings: RingsSettings = {
            ringStart: randRange(1.8, 2.2, body.rng, 1400),
            ringEnd: randRange(2.1, 2.9, body.rng, 1410),
            ringFrequency: 30.0,
            ringOpacity: body.rng(1420)
        };
        const uniforms: ShaderUniforms = [
            ...getBodyUniforms(body),
            ...getStarsUniforms(starSystem),
            ...getActiveCameraUniforms(scene),
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
                name: "planetRotationAxis",
                type: ShaderDataType.Vector3,
                get: () => {
                    return body.getRotationAxis();
                }
            }
        ];

        super(name, shaderName, uniforms, getSamplers(scene), scene);

        this.settings = settings;
    }
}
