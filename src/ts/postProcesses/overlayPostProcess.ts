import { SpacePostProcess } from "./spacePostProcess";
import { Effect } from "@babylonjs/core";
import overlayFragment from "../../shaders/overlayFragment.glsl";
import { UberScene } from "../core/uberScene";
import { ShaderDataType, ShaderUniforms } from "./interfaces";

const shaderName = "overlay";
Effect.ShadersStore[`${shaderName}FragmentShader`] = overlayFragment;

export class OverlayPostProcess extends SpacePostProcess {
    constructor(name: string, scene: UberScene) {
        const uniforms: ShaderUniforms = [
            {
                name: "aspectRatio",
                type: ShaderDataType.Float,
                get: () => {
                    return scene.getEngine().getScreenAspectRatio();
                }
            },
            {
                name: "cameraDirection",
                type: ShaderDataType.Vector3,
                get: () => {
                    return scene.getController().transform.getForwardDirection();
                }
            },
            {
                name: "isEnabled",
                type: ShaderDataType.Bool,
                get: () => {
                    return scene.isOverlayEnabled;
                }
            }
        ];
        super(name, shaderName, uniforms, [], scene);
    }
}