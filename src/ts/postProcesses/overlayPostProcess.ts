import { Effect } from "@babylonjs/core";
import overlayFragment from "../../shaders/overlayFragment.glsl";
import { UberScene } from "../uberCore/uberScene";
import { AbstractBody } from "../bodies/abstractBody";
import { getActiveCameraUniforms, getBodyUniforms, getSamplers } from "./uniforms";
import { ShaderDataType, ShaderUniforms } from "../uberCore/postProcesses/uberPostProcess";
import { BodyPostProcess } from "./bodyPostProcess";

const shaderName = "overlay";
Effect.ShadersStore[`${shaderName}FragmentShader`] = overlayFragment;

export class OverlayPostProcess extends BodyPostProcess {
    static ARE_ENABLED = true;

    constructor(body: AbstractBody, scene: UberScene) {
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

        super(body.name + "Overlay", body, shaderName, uniforms, samplers, scene);
    }
}
