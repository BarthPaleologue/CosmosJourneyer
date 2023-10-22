import lensFlareFragment from "../../../shaders/lensflare.glsl";
import { UberScene } from "../../controller/uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers } from "./uniforms";
import { UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { ObjectPostProcess } from "./objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderSamplers, ShaderUniforms, UniformEnumType } from "../../controller/uberCore/postProcesses/types";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";
import { Star } from "../bodies/stellarObjects/star";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

const shaderName = "lensflare";
Effect.ShadersStore[`${shaderName}FragmentShader`] = lensFlareFragment;

export type LensFlareSettings = {
    // empty for now
};

export class LensFlarePostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly settings: LensFlareSettings;
    readonly object: StellarObject;

    constructor(object: StellarObject, scene: UberScene) {
        const settings: LensFlareSettings = {};

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(object),
            ...getActiveCameraUniforms(scene),
            {
                name: "flareColor",
                type: UniformEnumType.Vector3,
                get: () => {
                    if (object instanceof Star) return object.model.surfaceColor;
                    else return new Vector3(1, 1, 1);
                }
            },
            {
                name: "aspectRatio",
                type: UniformEnumType.Float,
                get: () => {
                    return scene.getEngine().getScreenAspectRatio();
                }
            }
        ];

        const samplers: ShaderSamplers = [...getSamplers(scene)];

        super(object.name, shaderName, uniforms, samplers, scene);

        this.object = object;
        this.settings = settings;
    }
}
