import {Scene} from "@babylonjs/core";
import {SolidPlanet} from "../../celestialBodies/planets/solid/solidPlanet";
import {RingsSettings, ShaderDataType, ShaderSamplerData, ShaderUniformData} from "../interfaces";
import {PlanetPostProcess} from "../planetPostProcess";
import {Star} from "../../celestialBodies/stars/star";

export class RingsPostProcess extends PlanetPostProcess {

    settings: RingsSettings;

    constructor(name: string, planet: SolidPlanet, sun: Star, scene: Scene) {

        let settings: RingsSettings = {
            ringStart: 1.5,
            ringEnd: 2.5,
            ringFrequency: 30.0,
            ringOpacity: 0.4
        };

        let uniforms: ShaderUniformData = {
            "ringStart": {
                type: ShaderDataType.Float,
                get: () => {return settings.ringStart}
            },
            "ringEnd": {
                type: ShaderDataType.Float,
                get: () => {return settings.ringEnd}
            },
            "ringFrequency": {
                type: ShaderDataType.Float,
                get: () => {return settings.ringFrequency}
            },
            "ringOpacity": {
                type: ShaderDataType.Float,
                get: () => {return settings.ringOpacity}
            },

            "planetWorldMatrix": {
                type: ShaderDataType.Matrix,
                get: () => {return planet.getWorldMatrix()}
            }
        };

        let samplers: ShaderSamplerData = {}

        super(name, "./shaders/rings", uniforms, samplers, planet, sun, scene);

        this.settings = settings;
    }
}