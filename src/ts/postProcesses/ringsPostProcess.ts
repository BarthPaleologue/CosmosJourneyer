import { Effect } from "@babylonjs/core";

import ringsFragment from "../../shaders/ringsFragment.glsl";
import { AbstractBody } from "../bodies/abstractBody";
import { UberScene } from "../uberCore/uberScene";
import { ShaderDataType, ShaderUniforms } from "../uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getBodyUniforms, getSamplers, getStarsUniforms } from "./uniforms";
import { randRange } from "extended-random";
import { BlackHole } from "../bodies/stellarObjects/blackHole";
import { Star } from "../bodies/stellarObjects/star";
import { BodyPostProcess } from "./bodyPostProcess";

const shaderName = "rings";
Effect.ShadersStore[`${shaderName}FragmentShader`] = ringsFragment;

interface RingsSettings {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
}

export class RingsPostProcess extends BodyPostProcess {
    settings: RingsSettings;

    constructor(body: AbstractBody, scene: UberScene, stars: (Star | BlackHole)[]) {
        const settings: RingsSettings = {
            ringStart: randRange(1.8, 2.2, body.descriptor.rng, 1400),
            ringEnd: randRange(2.1, 2.9, body.descriptor.rng, 1410),
            ringFrequency: 30.0,
            ringOpacity: body.descriptor.rng(1420)
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

        super(body.name + "Rings", body, shaderName, uniforms, getSamplers(scene), scene);

        this.settings = settings;
    }
}
