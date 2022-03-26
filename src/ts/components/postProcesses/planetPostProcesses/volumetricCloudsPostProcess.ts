import {Scene} from "@babylonjs/core";
import {SolidPlanet} from "../../celestialBodies/planets/solid/solidPlanet";
import {ShaderDataType, ShaderSamplerData, ShaderUniformData, VolumetricCloudSettings} from "../interfaces";
import {PlanetPostProcess} from "../planetPostProcess";
import {Star} from "../../celestialBodies/stars/star";

export class VolumetricCloudsPostProcess extends PlanetPostProcess {

    settings: VolumetricCloudSettings;

    constructor(name: string, planet: SolidPlanet, atmosphereRadius: number, sun: Star, scene: Scene) {

        let settings: VolumetricCloudSettings = {
            atmosphereRadius: atmosphereRadius
        }

        let uniforms: ShaderUniformData = {
            "atmosphereRadius": {
                type: ShaderDataType.Float,
                get: () => {return settings.atmosphereRadius}
            }
        };

        let samplers: ShaderSamplerData = {}

        super(name, "./shaders/volumetricClouds", uniforms, samplers, planet, sun, scene);

        this.settings = settings;
    }
}