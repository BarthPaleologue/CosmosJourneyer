import { SpacePostProcess } from "./spacePostProcess";
import { Axis } from "@babylonjs/core";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "./interfaces";
import { AbstractBody } from "../bodies/abstractBody";
import { UberScene } from "../core/uberScene";

export abstract class PlanetPostProcess extends SpacePostProcess {
    constructor(
        name: string,
        fragmentName: string,
        otherUniforms: ShaderUniforms,
        otherSamplers: ShaderSamplers,
        body: AbstractBody,
        scene: UberScene
    ) {
        const uniforms: ShaderUniforms = [
            {
                name: "planetPosition",
                type: ShaderDataType.Vector3,
                get: () => {
                    return body.getAbsolutePosition();
                }
            },
            {
                name: "cameraDirection",
                type: ShaderDataType.Vector3,
                get: () => {
                    return scene.getActiveUberCamera().getDirection(Axis.Z);
                }
            },
            {
                name: "planetRadius",
                type: ShaderDataType.Float,
                get: () => {
                    return body.getApparentRadius();
                }
            }
        ];

        uniforms.push(...otherUniforms);

        super(name, fragmentName, uniforms, otherSamplers, scene);
    }
}
