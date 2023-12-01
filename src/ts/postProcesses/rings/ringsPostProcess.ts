import ringsFragment from "../../../shaders/ringsFragment.glsl";
import { AbstractBody } from "../../bodies/abstractBody";
import { UberScene } from "../../uberCore/uberScene";
import { UberPostProcess } from "../../uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "../uniforms";
import { ObjectPostProcess } from "../objectPostProcess";
import { StellarObject } from "../../stellarObjects/stellarObject";
import { Effect } from "@babylonjs/core/Materials/effect";
import { SamplerEnumType, ShaderSamplers, ShaderUniforms } from "../../uberCore/postProcesses/types";
import { RingsUniforms } from "./ringsUniform";
import { Scene } from "@babylonjs/core/scene";
import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import ringsLUT from "../../../shaders/textures/ringsLUT.glsl";

export class RingsPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly ringsUniforms: RingsUniforms;
    readonly object: AbstractBody;
    readonly lut: ProceduralTexture;

    constructor(body: AbstractBody, scene: UberScene, stellarObjects: StellarObject[]) {

        const shaderName = "rings";
        if(Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = ringsFragment;
        }

        const ringsUniforms = body.model.ringsUniforms;
        if (ringsUniforms === null)
            throw new Error(
                `RingsPostProcess: ringsUniforms are null. This should not be possible as the postprocess should not be created if the body has no rings. Body: ${body.name}`
            );
        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(body),
            ...getStellarObjectsUniforms(stellarObjects),
            ...getActiveCameraUniforms(scene),
            ...ringsUniforms.getShaderUniforms()
        ];

        const lut = RingsPostProcess.CreateLUT(body.model.seed, ringsUniforms.ringStart, ringsUniforms.ringEnd, ringsUniforms.ringFrequency, scene);

        const samplers: ShaderSamplers = [
            ...getSamplers(scene),
            {
                name: "ringsLUT",
                type: SamplerEnumType.Texture,
                get: () => {
                    //console.log(scene.isReady());
                    return this.lut;
                }
            }
        ];

        super(body.name + "Rings", shaderName, uniforms, samplers, scene);

        this.object = body;
        this.ringsUniforms = ringsUniforms;
        this.lut = lut;
    }

    static CreateLUT(seed: number, ringStart: number, ringEnd: number, frequency: number, scene: Scene): ProceduralTexture {
        const lut = new ProceduralTexture(
            "ringsLUT",
            {
                width: 4096,
                height: 1
            },
            { fragmentSource: ringsLUT },
            scene,
            undefined,
            false,
            false
        );
        lut.setFloat("seed", seed);
        lut.setFloat("frequency", frequency);
        lut.setFloat("ringStart", ringStart);
        lut.setFloat("ringEnd", ringEnd);
        lut.refreshRate = 0;

        return lut;
    }
}
