import { Effect } from "@babylonjs/core";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "../interfaces";
import { PlanetPostProcess } from "../planetPostProcess";

import volumetricCloudsFragment from "../../../shaders/volumetricCloudsFragment.glsl";
import { Planet } from "../../bodies/planets/planet";
import { UberScene } from "../../core/uberScene";
import { StarSystem } from "../../bodies/starSystem";

const shaderName = "volumetricClouds";
Effect.ShadersStore[`${shaderName}FragmentShader`] = volumetricCloudsFragment;

export interface VolumetricCloudSettings {
    atmosphereRadius: number;
}

export class VolumetricCloudsPostProcess extends PlanetPostProcess {
    settings: VolumetricCloudSettings;

    constructor(name: string, planet: Planet, atmosphereRadius: number, scene: UberScene, starSystem: StarSystem) {
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

        super(name, shaderName, uniforms, samplers, planet, scene, starSystem);

        this.settings = settings;

        for (const pipeline of scene.pipelines) {
            pipeline.clouds.push(this);
        }
    }
}
