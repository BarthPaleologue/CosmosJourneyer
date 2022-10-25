import { Effect } from "@babylonjs/core";

import volumetricCloudsFragment from "../../shaders/volumetricCloudsFragment.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getBodyUniforms, getSamplers, getStarsUniforms } from "./uniforms";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "../uberCore/postProcesses/uberPostProcess";
import { BlackHole } from "../bodies/blackHole";
import { Star } from "../bodies/stars/star";
import { TelluricPlanet } from "../bodies/planets/telluricPlanet";
import { BodyPostProcess } from "./bodyPostProcess";

const shaderName = "volumetricClouds";
Effect.ShadersStore[`${shaderName}FragmentShader`] = volumetricCloudsFragment;

export interface VolumetricCloudSettings {
    atmosphereRadius: number;
}

export class VolumetricCloudsPostProcess extends BodyPostProcess {
    settings: VolumetricCloudSettings;

    constructor(name: string, planet: TelluricPlanet, atmosphereRadius: number, scene: UberScene, stars: (Star | BlackHole)[]) {
        const settings: VolumetricCloudSettings = {
            atmosphereRadius: atmosphereRadius
        };

        const uniforms: ShaderUniforms = [
            ...getBodyUniforms(planet),
            ...getStarsUniforms(stars),
            ...getActiveCameraUniforms(scene),
            {
                name: "atmosphereRadius",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.atmosphereRadius;
                }
            }
        ];

        const samplers: ShaderSamplers = getSamplers(scene);

        super(name, planet, shaderName, uniforms, samplers, scene);

        this.settings = settings;
    }
}
