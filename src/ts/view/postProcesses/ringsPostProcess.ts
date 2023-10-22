import ringsFragment from "../../../shaders/ringsFragment.glsl";
import { AbstractBody } from "../bodies/abstractBody";
import { UberScene } from "../../controller/uberCore/uberScene";
import { UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { ObjectPostProcess } from "./objectPostProcess";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";
import { Effect } from "@babylonjs/core/Materials/effect";
import { UniformEnumType, ShaderUniforms } from "../../controller/uberCore/postProcesses/types";
import { RingsUniforms } from "../../model/ringsUniform";

const shaderName = "rings";
Effect.ShadersStore[`${shaderName}FragmentShader`] = ringsFragment;

export class RingsPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly ringsUniforms: RingsUniforms;
    readonly object: AbstractBody;

    constructor(body: AbstractBody, scene: UberScene, stellarObjects: StellarObject[]) {
        const ringsUniforms = body.model.ringsUniforms;
        if (ringsUniforms === null)
            throw new Error(
                `RingsPostProcess: ringsUniforms are null. This should not be possible as the postprocess should not be created if the body has no rings. Body: ${body.name}`
            );
        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(body),
            ...getStellarObjectsUniforms(stellarObjects),
            ...getActiveCameraUniforms(scene),
            {
                name: "rings.start",
                type: UniformEnumType.Float,
                get: () => {
                    return ringsUniforms.ringStart;
                }
            },
            {
                name: "rings.end",
                type: UniformEnumType.Float,
                get: () => {
                    return ringsUniforms.ringEnd;
                }
            },
            {
                name: "rings.frequency",
                type: UniformEnumType.Float,
                get: () => {
                    return ringsUniforms.ringFrequency;
                }
            },
            {
                name: "rings.opacity",
                type: UniformEnumType.Float,
                get: () => {
                    return ringsUniforms.ringOpacity;
                }
            },
            {
                name: "rings.color",
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
