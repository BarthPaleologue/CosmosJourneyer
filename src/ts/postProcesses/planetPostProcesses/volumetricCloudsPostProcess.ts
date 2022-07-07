import { Effect, Scene } from "@babylonjs/core";
import { ShaderDataType, ShaderSamplerData, ShaderUniformData, VolumetricCloudSettings } from "../interfaces";
import { PlanetPostProcess } from "../planetPostProcess";
import { Star } from "../../bodies/stars/star";
import { AbstractPlanet } from "../../bodies/planets/abstractPlanet";

import volumetricCloudsFragment from "../../../shaders/volumetricCloudsFragment.glsl";

const shaderName = "volumetricClouds";
Effect.ShadersStore[`${shaderName}FragmentShader`] = volumetricCloudsFragment;

export class VolumetricCloudsPostProcess extends PlanetPostProcess {
    settings: VolumetricCloudSettings;

    constructor(name: string, planet: AbstractPlanet, atmosphereRadius: number, sun: Star, scene: Scene) {
        const settings: VolumetricCloudSettings = {
            atmosphereRadius: atmosphereRadius
        };

        const uniforms: ShaderUniformData = {
            atmosphereRadius: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.atmosphereRadius;
                }
            }
        };

        const samplers: ShaderSamplerData = {};

        super(name, shaderName, uniforms, samplers, planet, sun, scene);

        this.settings = settings;
    }
}
