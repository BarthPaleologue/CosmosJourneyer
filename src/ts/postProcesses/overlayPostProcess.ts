import { Effect } from "@babylonjs/core";
import overlayFragment from "../../shaders/overlayFragment.glsl";
import { UberScene } from "../core/uberScene";
import { ShaderDataType, ShaderUniforms } from "./interfaces";
import { AbstractBody } from "../bodies/abstractBody";
import { getActiveCameraUniforms, getBodyUniforms, getSamplers } from "./uniforms";
import { UberPostProcess } from "./uberPostProcess";

const shaderName = "overlay";
Effect.ShadersStore[`${shaderName}FragmentShader`] = overlayFragment;

export class OverlayPostProcess extends UberPostProcess {
    static ARE_ENABLED = true;

    constructor(name: string, body: AbstractBody, scene: UberScene) {
        const uniforms: ShaderUniforms = [
            ...getActiveCameraUniforms(scene),
            ...getBodyUniforms(body),
            {
                name: "aspectRatio",
                type: ShaderDataType.Float,
                get: () => {
                    return scene.getEngine().getScreenAspectRatio();
                }
            },
            {
                name: "isEnabled",
                type: ShaderDataType.Bool,
                get: () => {
                    return OverlayPostProcess.ARE_ENABLED;
                }
            }
        ];

        const samplers = getSamplers(scene);

        super(name, shaderName, uniforms, samplers, scene);

        scene.uberRenderingPipeline.overlays.push(this);

    }
}
