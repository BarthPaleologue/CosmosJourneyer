import ringsFragment from "../../../shaders/ringsFragment.glsl";
import { UberScene } from "../../uberCore/uberScene";
import { UberPostProcess } from "../../uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "../uniforms";
import { ObjectPostProcess } from "../objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderSamplers, ShaderUniforms } from "../../uberCore/postProcesses/types";
import { RingsUniforms } from "./ringsUniform";
import { Transformable } from "../../uberCore/transforms/basicTransform";
import { CelestialBody } from "../../architecture/celestialBody";

export class RingsPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly ringsUniforms: RingsUniforms;
    readonly object: CelestialBody;

    public static async CreateAsync(body: CelestialBody, scene: UberScene, stellarObjects: Transformable[]): Promise<RingsPostProcess> {
        const shaderName = "rings";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = ringsFragment;
        }

        const ringsUniforms = body.getRingsUniforms();
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

        return ringsUniforms.getShaderSamplers(scene).then((ringSamplers) => {
            const samplers: ShaderSamplers = [...getSamplers(scene), ...ringSamplers];
            return new RingsPostProcess(body.name + "Rings", shaderName, uniforms, samplers, scene, body, ringsUniforms);
        });
    }

    private constructor(name: string, shaderName: string, uniforms: ShaderUniforms, samplers: ShaderSamplers, scene: UberScene, body: CelestialBody, ringsUniforms: RingsUniforms) {
        super(name, shaderName, uniforms, samplers, scene);

        this.object = body;
        this.ringsUniforms = ringsUniforms;
    }
}
