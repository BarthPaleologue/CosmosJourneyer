import ringsFragment from "../../shaders/ringsFragment.glsl";
import { AbstractBody } from "../bodies/abstractBody";
import { UberScene } from "../uberCore/uberScene";
import { ShaderDataType, ShaderUniforms } from "../uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { normalRandom, randRange } from "extended-random";
import { BodyPostProcess } from "./bodyPostProcess";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { clamp } from "terrain-generation";

const shaderName = "rings";
Effect.ShadersStore[`${shaderName}FragmentShader`] = ringsFragment;

interface RingsSettings {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
    ringColor: Color3;
}

export class RingsPostProcess extends BodyPostProcess {
    settings: RingsSettings;

    constructor(body: AbstractBody, scene: UberScene, stellarObjects: StellarObject[]) {
        const settings: RingsSettings = {
            ringStart: randRange(1.8, 2.2, body.descriptor.rng, 1400),
            ringEnd: randRange(2.1, 4.0, body.descriptor.rng, 1410),
            ringFrequency: 30.0,
            ringOpacity: clamp(normalRandom(0.7, 0.1, body.descriptor.rng, 1420), 0, 1),
            ringColor: new Color3(214, 168, 122).scaleInPlace(1 / 255)
        };
        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(body),
            ...getStellarObjectsUniforms(stellarObjects),
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
                name: "ringColor",
                type: ShaderDataType.Color3,
                get: () => {
                    return settings.ringColor;
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
