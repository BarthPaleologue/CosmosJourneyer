import { SpacePostProcess } from "./spacePostProcess";
import { Axis, Scene } from "@babylonjs/core";
import { ShaderDataType, ShaderSamplerData, ShaderUniformData } from "./interfaces";
import { Star } from "../celestialBodies/stars/star";
import { AbstractBody } from "../celestialBodies/abstractBody";

export abstract class PlanetPostProcess extends SpacePostProcess {
    protected constructor(name: string, fragmentName: string, uniforms: ShaderUniformData, samplers: ShaderSamplerData, body: AbstractBody, sun: Star, scene: Scene) {
        let commonUniforms = {
            sunPosition: {
                type: ShaderDataType.Vector3,
                get: () => {
                    return sun.getAbsolutePosition();
                }
            },
            planetPosition: {
                type: ShaderDataType.Vector3,
                get: () => {
                    return body.getAbsolutePosition();
                }
            },
            cameraDirection: {
                type: ShaderDataType.Vector3,
                get: () => {
                    return scene.activeCamera!.getDirection(Axis.Z);
                }
            },
            planetRadius: {
                type: ShaderDataType.Float,
                get: () => {
                    return body.getApparentRadius();
                }
            }
        };

        Object.assign(commonUniforms, commonUniforms, uniforms);

        super(name, fragmentName, commonUniforms, samplers, scene);
    }
}
