import overlayFragment from "../../shaders/overlayFragment.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers } from "./uniforms";
import { ShaderDataType, ShaderUniforms } from "../uberCore/postProcesses/uberPostProcess";
import { BodyPostProcess } from "./bodyPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { BaseObject } from "../orbits/iOrbitalBody";

const shaderName = "overlay";
Effect.ShadersStore[`${shaderName}FragmentShader`] = overlayFragment;

export class OverlayPostProcess extends BodyPostProcess {
    static ARE_ENABLED = true;

    constructor(object: BaseObject, scene: UberScene) {
        const uniforms: ShaderUniforms = [
            ...getActiveCameraUniforms(scene),
            ...getObjectUniforms(object),
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

        super(object.name + "Overlay", object, shaderName, uniforms, samplers, scene);
    }
}
