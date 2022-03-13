import {Scene, Texture} from "@babylonjs/core";

import waterbump from "../../../../asset/textures/waterbump.png";
import {SolidPlanet} from "../../celestialBodies/planets/solid/solidPlanet";
import {OceanSettings, ShaderDataType, ShaderSamplerData, ShaderUniformData} from "../interfaces";
import {PlanetPostProcess} from "../planetPostProcess";
import {Star} from "../../celestialBodies/stars/star";

export class OceanPostProcess extends PlanetPostProcess {

    settings: OceanSettings;

    internalTime: number;

    constructor(name: string, planet: SolidPlanet, sun: Star, scene: Scene) {

        let settings: OceanSettings = {
            oceanRadius: planet.getRadius(),
            depthModifier: 0.002,
            alphaModifier: 0.007,
            specularPower: 2,
            smoothness: 0.9,
        };

        let uniforms: ShaderUniformData = {
            "oceanRadius": {
                type: ShaderDataType.Float,
                get: () => {return settings.oceanRadius}
            },

            "smoothness": {
                type: ShaderDataType.Float,
                get: () => {return settings.smoothness}
            },
            "specularPower": {
                type: ShaderDataType.Float,
                get: () => {return settings.specularPower}
            },
            "alphaModifier": {
                type: ShaderDataType.Float,
                get: () => {return settings.alphaModifier}
            },
            "depthModifier": {
                type: ShaderDataType.Float,
                get: () => {return settings.depthModifier}
            },

            "planetWorldMatrix": {
                type: ShaderDataType.Matrix,
                get: () => {return planet.getWorldMatrix()}
            },

            "time": {
                type: ShaderDataType.Float,
                get: () => {
                    this.internalTime += scene.getEngine().getDeltaTime() / 1000;
                    return this.internalTime;
                }
            }
        };

        let samplers: ShaderSamplerData = {
            "normalMap": {
                type: ShaderDataType.Texture,
                get: () => {return new Texture(waterbump, scene)}
            }
        }

        super(name, "./shaders/ocean", planet, sun, uniforms, samplers, scene);

        this.internalTime = 0;

        this.settings = settings;
    }
}