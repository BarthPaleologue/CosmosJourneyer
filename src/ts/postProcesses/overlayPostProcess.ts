import { Effect } from "@babylonjs/core";
import overlayFragment from "../../shaders/overlayFragment.glsl";
import { UberScene } from "../core/uberScene";
import { ShaderDataType, ShaderUniforms } from "./interfaces";
import { StarSystem } from "../bodies/starSystem";
import { PlanetPostProcess } from "./planetPostProcess";
import { AbstractBody } from "../bodies/abstractBody";

const shaderName = "overlay";
Effect.ShadersStore[`${shaderName}FragmentShader`] = overlayFragment;

export class OverlayPostProcess extends PlanetPostProcess {
    //FIXME: should not require starSystem
    static ARE_ENABLED = true;
    constructor(name: string, body: AbstractBody, scene: UberScene, starSystem: StarSystem) {
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
                    return scene.getActiveController().transform.getForwardDirection();
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
        super(name, shaderName, uniforms, [], body, scene, starSystem);

        for (const pipeline of scene.pipelines) {
            pipeline.overlays.push(this);
        }
    }
}
