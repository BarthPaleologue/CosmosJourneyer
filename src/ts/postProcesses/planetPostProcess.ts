import {SpacePostProcess} from "./spacePostProcess";
import {Axis, Scene} from "@babylonjs/core";
import {ShaderDataType, ShaderSamplerData, ShaderUniformData} from "./interfaces";
import {Star} from "../celestialBodies/stars/star";
import {AbstractPlanet} from "../celestialBodies/planets/abstractPlanet";

export abstract class PlanetPostProcess extends SpacePostProcess {
    protected constructor(name: string, fragmentURL: string, uniforms: ShaderUniformData, samplers: ShaderSamplerData, planet: AbstractPlanet, sun: Star, scene: Scene) {

        let commonUniforms = {
            "sunPosition": {
                type: ShaderDataType.Vector3,
                get: () => {
                    return sun.getAbsolutePosition()
                }
            },
            "planetPosition": {
                type: ShaderDataType.Vector3,
                get: () => {
                    return planet.getAbsolutePosition()
                }
            },
            "cameraDirection": {
                type: ShaderDataType.Vector3,
                get: () => {
                    return scene.activeCamera!.getDirection(Axis.Z)
                }
            },
            "planetRadius": {
                type: ShaderDataType.Float,
                get: () => {
                    return planet.getRadius()
                }
            }
        }

        Object.assign(commonUniforms, commonUniforms, uniforms);

        super(name, fragmentURL, commonUniforms, samplers, scene);
    }
}