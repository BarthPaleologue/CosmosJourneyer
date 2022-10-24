import { Effect } from "@babylonjs/core";

import ringsFragment from "../../shaders/ringsFragment.glsl";
import { AbstractBody } from "../bodies/abstractBody";
import { UberScene } from "../core/uberScene";
import { ShaderDataType, ShaderUniforms, UberPostProcess } from "../core/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getBodyUniforms, getSamplers, getStarsUniforms } from "./uniforms";
import { randRange } from "extended-random";
import { BlackHole } from "../bodies/blackHole";
import { Star } from "../bodies/stars/star";

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
    readonly body: AbstractBody;

    constructor(name: string, body: AbstractBody, scene: UberScene, stars: (Star | BlackHole)[]) {
        const settings: RingsSettings = {
            ringStart: randRange(1.8, 2.2, body.rng, 1400),
            ringEnd: randRange(2.1, 2.9, body.rng, 1410),
            ringFrequency: 30.0,
            ringOpacity: body.rng(1420)
        };
        const uniforms: ShaderUniforms = [
            ...getBodyUniforms(body),
            ...getStarsUniforms(stars),
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
        this.body = body;
    }
}
