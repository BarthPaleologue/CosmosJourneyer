import { Effect } from "@babylonjs/core";
import { ShaderDataType, ShaderSamplerData, ShaderUniformData, VolumetricCloudSettings } from "../interfaces";
import { PlanetPostProcess } from "../planetPostProcess";
import { AbstractPlanet } from "../../bodies/planets/abstractPlanet";

import volumetricCloudsFragment from "../../../shaders/volumetricCloudsFragment.glsl";
import { StarSystemManager } from "../../bodies/starSystemManager";

const shaderName = "volumetricClouds";
Effect.ShadersStore[`${shaderName}FragmentShader`] = volumetricCloudsFragment;

export class VolumetricCloudsPostProcess extends PlanetPostProcess {
    settings: VolumetricCloudSettings;

    constructor(name: string, planet: AbstractPlanet, atmosphereRadius: number, starSystem: StarSystemManager) {
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

        super(name, shaderName, uniforms, samplers, planet, starSystem.stars[0], starSystem.scene);

        this.settings = settings;

        for (const pipeline of starSystem.pipelines) {
            pipeline.clouds.push(this);
        }
    }
}
