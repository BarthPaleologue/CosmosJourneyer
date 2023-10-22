import overlayFragment from "../../../shaders/overlayFragment.glsl";
import { UberScene } from "../../controller/uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers } from "./uniforms";
import { UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { ObjectPostProcess } from "./objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { BaseObject } from "../common";
import {UniformEnumType, ShaderUniforms} from "../../controller/uberCore/postProcesses/types";

const shaderName = "overlay";
Effect.ShadersStore[`${shaderName}FragmentShader`] = overlayFragment;

export class OverlayPostProcess extends UberPostProcess implements ObjectPostProcess {
    static ARE_ENABLED = true;
    readonly object: BaseObject;

    constructor(object: BaseObject, scene: UberScene) {
        const uniforms: ShaderUniforms = [
            ...getActiveCameraUniforms(scene),
            ...getObjectUniforms(object),
            {
                name: "aspectRatio",
                type: UniformEnumType.Float,
                get: () => {
                    return scene.getEngine().getScreenAspectRatio();
                }
            },
            {
                name: "isEnabled",
                type: UniformEnumType.Bool,
                get: () => {
                    return OverlayPostProcess.ARE_ENABLED;
                }
            }
        ];

        const samplers = getSamplers(scene);

        super(object.name + "Overlay", shaderName, uniforms, samplers, scene);

        this.object = object;
    }
}
