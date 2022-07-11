import { SpacePostProcess } from "./spacePostProcess";
import { Axis, Scene } from "@babylonjs/core";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "./interfaces";
import { Star } from "../bodies/stars/star";
import { AbstractBody } from "../bodies/abstractBody";
import { StarSystemManager } from "../bodies/starSystemManager";

export abstract class PlanetPostProcess extends SpacePostProcess {
    protected constructor(
        name: string,
        fragmentName: string,
        otherUniforms: ShaderUniforms,
        otherSamplers: ShaderSamplers,
        body: AbstractBody,
        sun: Star,
        starSystem: StarSystemManager
    ) {
        const uniforms: ShaderUniforms = [
            {
                name: "sunPosition",
                type: ShaderDataType.Vector3,
                get: () => {
                    return sun.getAbsolutePosition();
                }
            },
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
                    return starSystem.scene.activeCamera!.getDirection(Axis.Z);
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

        super(name, fragmentName, uniforms, otherSamplers, starSystem);
    }
}
