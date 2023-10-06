import ringsFragment from "../../../shaders/ringsFragment.glsl";
import { AbstractBody } from "../bodies/abstractBody";
import { UberScene } from "../../controller/uberCore/uberScene";
import { UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { normalRandom, randRange } from "extended-random";
import { ObjectPostProcess } from "./objectPostProcess";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { clamp } from "terrain-generation";
import { UniformEnumType, ShaderUniforms, UniformData } from "../../controller/uberCore/postProcesses/types";

const shaderName = "rings";
Effect.ShadersStore[`${shaderName}FragmentShader`] = ringsFragment;

type RingsUniforms = {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
    ringColor: Color3;
};

export class RingsPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly ringsUniforms: RingsUniforms;
    readonly object: AbstractBody;

    constructor(body: AbstractBody, scene: UberScene, stellarObjects: StellarObject[]) {
        const ringsUniforms: RingsUniforms = {
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
                name: "ringsUniforms",
                type: UniformEnumType.CUSTOM_STRUCT,
                get: () => ringsUniforms,
                customTransferHandler: (effect, uniform) => {
                    const ringsUniforms = uniform.get() as RingsUniforms;
                    effect.setFloat("ringsUniforms.ringStart", ringsUniforms.ringStart);
                    effect.setFloat("ringsUniforms.ringEnd", ringsUniforms.ringEnd);
                    effect.setFloat("ringsUniforms.ringFrequency", ringsUniforms.ringFrequency);
                    effect.setFloat("ringsUniforms.ringOpacity", ringsUniforms.ringOpacity);
                    effect.setColor3("ringsUniforms.ringColor", ringsUniforms.ringColor);
                }
            } as UniformData<RingsUniforms>,
            {
                name: "ringStart",
                type: UniformEnumType.Float,
                get: () => {
                    return ringsUniforms.ringStart;
                }
            },
            {
                name: "ringEnd",
                type: UniformEnumType.Float,
                get: () => {
                    return ringsUniforms.ringEnd;
                }
            },
            {
                name: "ringFrequency",
                type: UniformEnumType.Float,
                get: () => {
                    return ringsUniforms.ringFrequency;
                }
            },
            {
                name: "ringOpacity",
                type: UniformEnumType.Float,
                get: () => {
                    return ringsUniforms.ringOpacity;
                }
            },
            {
                name: "ringColor",
                type: UniformEnumType.Color3,
                get: () => {
                    return ringsUniforms.ringColor;
                }
            },
            {
                name: "planetRotationAxis",
                type: UniformEnumType.Vector3,
                get: () => {
                    return body.getRotationAxis();
                }
            }
        ];

        super(body.name + "Rings", shaderName, uniforms, getSamplers(scene), scene);

        this.object = body;
        this.ringsUniforms = ringsUniforms;
    }
}
