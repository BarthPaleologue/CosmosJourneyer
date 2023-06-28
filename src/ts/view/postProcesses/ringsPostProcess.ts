import ringsFragment from "../../../shaders/ringsFragment.glsl";
import { AbstractBody } from "../bodies/abstractBody";
import { UberScene } from "../../controller/uberCore/uberScene";
import { ShaderDataType, ShaderUniforms, UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { normalRandom, randRange } from "extended-random";
import { ObjectPostProcess } from "./objectPostProcess";
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

export class RingsPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly settings: RingsSettings;
    readonly object: AbstractBody;

    constructor(body: AbstractBody, scene: UberScene, stellarObjects: StellarObject[]) {
        const settings: RingsSettings = {
            ringStart: randRange(1.8, 2.2, body.model.rng, 1400),
            ringEnd: randRange(2.1, 4.0, body.model.rng, 1410),
            ringFrequency: 30.0,
            ringOpacity: clamp(normalRandom(0.7, 0.1, body.model.rng, 1420), 0, 1),
            ringColor: new Color3(214, 168, 122).scaleInPlace(randRange(1.0, 1.5, body.model.rng, 1430) / 255)
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

        super(body.name + "Rings", shaderName, uniforms, getSamplers(scene), scene);

        this.object = body;
        this.settings = settings;
    }
}
