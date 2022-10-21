import { Effect } from "@babylonjs/core";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "../interfaces";

import volumetricCloudsFragment from "../../../shaders/volumetricCloudsFragment.glsl";
import { Planet } from "../../bodies/planets/planet";
import { UberScene } from "../../core/uberScene";
import { getActiveCameraUniforms, getBodyUniforms, getSamplers, getStarsUniforms } from "../uniforms";
import { UberPostProcess } from "../uberPostProcess";
import { BlackHole } from "../../bodies/blackHole";
import { Star } from "../../bodies/stars/star";

const shaderName = "volumetricClouds";
Effect.ShadersStore[`${shaderName}FragmentShader`] = volumetricCloudsFragment;

export interface VolumetricCloudSettings {
    atmosphereRadius: number;
}

export class VolumetricCloudsPostProcess extends UberPostProcess {
    settings: VolumetricCloudSettings;

    constructor(name: string, planet: Planet, atmosphereRadius: number, scene: UberScene, stars: (Star | BlackHole)[]) {
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

        super(name, shaderName, uniforms, samplers, scene);

        this.settings = settings;
    }
}
