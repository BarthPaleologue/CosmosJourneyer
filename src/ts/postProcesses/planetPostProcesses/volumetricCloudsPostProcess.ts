import { Effect } from "@babylonjs/core";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "../interfaces";
import { PlanetPostProcess } from "../planetPostProcess";

import volumetricCloudsFragment from "../../../shaders/volumetricCloudsFragment.glsl";
import { StarSystemManager } from "../../bodies/starSystemManager";
import { Planet } from "../../bodies/planets/planet";

const shaderName = "volumetricClouds";
Effect.ShadersStore[`${shaderName}FragmentShader`] = volumetricCloudsFragment;

export interface VolumetricCloudSettings {
    atmosphereRadius: number;
}

export class VolumetricCloudsPostProcess extends PlanetPostProcess {
    settings: VolumetricCloudSettings;

    constructor(name: string, planet: Planet, atmosphereRadius: number, starSystem: StarSystemManager) {
        const settings: VolumetricCloudSettings = {
            atmosphereRadius: atmosphereRadius
        };

        const uniforms: ShaderUniforms = [
            {
                name: "atmosphereRadius",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.atmosphereRadius;
                }
            }
        ];

        const samplers: ShaderSamplers = [];

        super(name, shaderName, uniforms, samplers, planet, starSystem.stars[0], starSystem);

        this.settings = settings;

        for (const pipeline of starSystem.pipelines) {
            pipeline.clouds.push(this);
        }
    }
}
