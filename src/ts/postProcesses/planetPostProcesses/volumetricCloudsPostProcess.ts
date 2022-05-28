import { Effect, Scene } from "@babylonjs/core";
import { ShaderDataType, ShaderSamplerData, ShaderUniformData, VolumetricCloudSettings } from "../interfaces";
import { PlanetPostProcess } from "../planetPostProcess";
import { Star } from "../../celestialBodies/stars/star";
import { AbstractPlanet } from "../../celestialBodies/planets/abstractPlanet";

import volumetricCloudsFragment from "../../../shaders/volumetricClouds.fragment.fx";

const shaderName = "volumetricClouds";
Effect.ShadersStore[`${shaderName}FragmentShader`] = volumetricCloudsFragment;

export class VolumetricCloudsPostProcess extends PlanetPostProcess {
    settings: VolumetricCloudSettings;

    constructor(name: string, planet: AbstractPlanet, atmosphereRadius: number, sun: Star, scene: Scene) {
        let settings: VolumetricCloudSettings = {
            atmosphereRadius: atmosphereRadius
        };

        let uniforms: ShaderUniformData = {
            atmosphereRadius: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.atmosphereRadius;
                }
            }
        };

        let samplers: ShaderSamplerData = {};

        super(name, shaderName, uniforms, samplers, planet, sun, scene);

        this.settings = settings;
    }
}
